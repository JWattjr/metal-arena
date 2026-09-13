"""Direct-mode fixtures plus the Windows message-timestamp compatibility shim."""

import json
import os
import tempfile

import pytest

from gltest.direct import loader
from gltest.direct.vm import VMContext


def _windows_safe_message_injection(vm):
    try:
        from genlayer.py import calldata
        from genlayer.py.types import Address
    except ImportError:
        return

    sender_address = vm.sender
    if isinstance(sender_address, bytes):
        sender_address = Address(sender_address)
    contract_address = vm._contract_address
    if isinstance(contract_address, bytes):
        contract_address = Address(contract_address)
    origin_address = vm.origin
    if isinstance(origin_address, bytes):
        origin_address = Address(origin_address)
    message_datetime = vm._datetime
    if isinstance(message_datetime, str) and len(message_datetime) >= 20 and message_datetime[19] == ".":
        message_datetime = message_datetime[:19] + "Z"
    if not isinstance(message_datetime, str) or len(message_datetime) != 20:
        message_datetime = "2025-01-01T00:00:00Z"
    message_data = {
        "contract_address": contract_address,
        "sender_address": sender_address,
        "origin_address": origin_address,
        "stack": [],
        "value": vm._value,
        "datetime": message_datetime,
        "is_init": False,
        "chain_id": vm._chain_id,
        "entry_kind": 0,
        "entry_data": b"",
        "entry_stage_data": None,
    }
    fd, path = tempfile.mkstemp()
    try:
        os.write(fd, calldata.encode(message_data))
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
        paths = getattr(vm, "_metal_arena_temp_message_paths", [])
        paths.append(path)
        vm._metal_arena_temp_message_paths = paths
    finally:
        os.close(fd)


_original_cleanup = VMContext._cleanup_after_deactivate
_original_refresh = VMContext._refresh_gl_message
loader._inject_message_to_fd0 = _windows_safe_message_injection


def _refresh_with_timestamp(vm):
    _original_refresh(vm)
    try:
        import genlayer.gl as gl

        message_datetime = vm._datetime
        if isinstance(message_datetime, str) and len(message_datetime) >= 20 and message_datetime[19] == ".":
            message_datetime = message_datetime[:19] + "Z"
        if not isinstance(message_datetime, str) or len(message_datetime) != 20:
            message_datetime = "2025-01-01T00:00:00Z"
        if hasattr(gl, "message_raw") and gl.message_raw is not None:
            gl.message_raw["datetime"] = message_datetime
    except ImportError:
        pass


VMContext._refresh_gl_message = _refresh_with_timestamp


def _cleanup_with_deferred_temp_files(vm):
    _original_cleanup(vm)
    for path in getattr(vm, "_metal_arena_temp_message_paths", []):
        try:
            os.unlink(path)
        except (FileNotFoundError, PermissionError):
            pass
    vm._metal_arena_temp_message_paths = []


VMContext._cleanup_after_deactivate = _cleanup_with_deferred_temp_files


def as_address(address):
    if hasattr(address, "as_hex"):
        return address
    from genlayer.py.types import Address

    return Address(address)


def reset_known_contract():
    try:
        from genlayer.gl import genvm_contracts

        genvm_contracts.__known_contract__ = None
    except ImportError:
        pass


def market_id(start="2025-01-01T00:15:00Z", metal="gold"):
    return f"{metal.lower()}-{start[0:10]}-{start[11:13]}-{start[14:16]}-{start[17:19]}Z"


def evidence_payload(market, opening, closing, opening_price=2_100_000_000, closing_price=2_101_000_000):
    payload = {
        "schema_version": "metal-arena-evidence-v1",
        "status": "FINALIZED",
        "market_id": market,
        "metal": "GOLD" if market.startswith("gold-") else "SILVER",
        "instrument": "SYNTHETIC-XAUUSD-SPOT" if market.startswith("gold-") else "SYNTHETIC-XAGUSD-SPOT",
        "currency": "USD",
        "unit": "USD_PER_TROY_OUNCE",
        "source_id": "metal-arena-synthetic-fixture-v1",
        "source_url": f"https://metal-arena.vercel.app/evidence/{market}.json",
        "opening_timestamp": opening,
        "opening_price": opening_price,
        "closing_timestamp": closing,
        "closing_price": closing_price,
        "selection_rule": "exact_boundary_observation",
        "max_gap_seconds": 0,
        "evidence_hash": "",
        "reason_code": "NONE",
    }
    import hashlib

    hash_payload = {key: value for key, value in payload.items() if key != "evidence_hash"}
    payload["evidence_hash"] = "sha256:" + hashlib.sha256(
        json.dumps(hash_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return payload


@pytest.fixture
def arena_contract(direct_deploy):
    return direct_deploy("contracts/metal_arena.py")


@pytest.fixture
def gate_contract(direct_deploy):
    return direct_deploy("contracts/settlement_gate.py")


@pytest.fixture
def wired_arena(direct_vm, direct_deploy, direct_owner):
    gate = direct_deploy("contracts/settlement_gate.py")
    reset_known_contract()
    arena = direct_deploy("contracts/metal_arena.py")
    return arena, gate
