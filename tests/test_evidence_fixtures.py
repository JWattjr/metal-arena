import hashlib
import json
from pathlib import Path

import pytest


FIXTURE_DIR = Path(__file__).parents[1] / "frontend" / "public" / "evidence"


def canonical_hash(record):
    payload = {key: value for key, value in record.items() if key != "evidence_hash"}
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


@pytest.mark.parametrize(
    "filename",
    [
        "gold-2025-01-01-00-00-00Z.json",
        "gold-2025-01-01-00-15-00Z.json",
        "gold-2026-09-13-20-00-00Z.json",
        "silver-2025-01-01-00-00-00Z.json",
        "silver-2025-01-01-00-15-00Z.json",
    ],
)
def test_public_fixture_has_a_self_consistent_canonical_hash(filename):
    record = json.loads((FIXTURE_DIR / filename).read_text(encoding="utf-8"))
    assert set(record) == {
        "schema_version",
        "status",
        "market_id",
        "metal",
        "instrument",
        "currency",
        "unit",
        "source_id",
        "source_url",
        "opening_timestamp",
        "opening_price",
        "closing_timestamp",
        "closing_price",
        "selection_rule",
        "max_gap_seconds",
        "evidence_hash",
        "reason_code",
    }
    assert record["status"] == "FINALIZED"
    assert record["selection_rule"] == "exact_boundary_observation"
    assert record["max_gap_seconds"] == 0
    assert record["opening_timestamp"] != record["closing_timestamp"] or record["opening_price"] == record["closing_price"]
    assert record["evidence_hash"] == canonical_hash(record)


def test_public_proof_manifest_binds_the_recorded_gold_case():
    manifest = json.loads((FIXTURE_DIR / "metal-arena-gold-case.json").read_text(encoding="utf-8"))
    assert manifest["designation"] == "HISTORICAL_REPLAY_SYNTHETIC"
    assert manifest["network"] == "GenLayer StudioNet"
    assert manifest["chain_id"] == 61999
    assert manifest["arena_address"] == "0x8a583769Ab90bD7B2ad5689EA7Ded3EFe5818B25"
    assert manifest["finality_gate_address"] == "0xD4Dc9acFdE859Ca8b2c3D37d2d63630e3ef49254"
    assert manifest["market_id"] == "gold-2026-09-13-20-00-00Z"
    assert manifest["source_policy"]["revision"] == "synthetic-boundary-v1"
    assert manifest["source_policy"]["selection_rule"] == "exact_boundary_observation"
    assert manifest["source_policy"]["max_gap_seconds"] == 0
    assert manifest["market"]["opening_price"] == 3_360_000_000
    assert manifest["market"]["closing_price"] == 3_361_000_000
    assert manifest["market"]["outcome"] == "UP"
    assert manifest["accounting"] == {
        "up_pool": 600,
        "down_pool": 400,
        "total_staked": 1000,
        "fee_amount": 20,
        "distributable_pool": 980,
        "claimed_payout": 980,
        "final_demo_balance": 980,
        "position_count": 2,
    }
    transactions = {item["action"]: item for item in manifest["transactions"]}
    assert transactions["Request settlement"]["execution"] == "SUCCESS"
    assert transactions["Claim UP payout"]["execution"] == "SUCCESS"
    assert transactions["Duplicate UP claim"]["execution"] == "ERROR"
    assert "already claimed" in transactions["Duplicate UP claim"]["note"]
