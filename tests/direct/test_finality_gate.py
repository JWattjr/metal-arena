from tests.direct.conftest import as_address


def test_gate_records_finalized_settlement_once(gate_contract, direct_vm, direct_owner, direct_alice):
    gate = gate_contract
    direct_vm.sender = direct_owner
    gate.configure_arena(as_address(direct_alice))
    direct_vm.sender = as_address(direct_alice)
    gate.record_finality(
        "gold-2025-01-01-00-15-00Z",
        "UP",
        392,
        8,
        2_100_000_000,
        2_101_000_000,
        "https://metal-arena.vercel.app/evidence/gold-2025-01-01-00-15-00Z.json",
        "sha256:" + "a" * 64,
    )
    record = gate.get_finality("gold-2025-01-01-00-15-00Z")
    assert record["finalized"] is True
    assert record["outcome"] == "UP"
    # The exact same finalized callback is idempotent.
    gate.record_finality(
        "gold-2025-01-01-00-15-00Z",
        "UP",
        392,
        8,
        2_100_000_000,
        2_101_000_000,
        "https://metal-arena.vercel.app/evidence/gold-2025-01-01-00-15-00Z.json",
        "sha256:" + "a" * 64,
    )
    assert gate.get_gate_status()["finalized_markets"] == 1


def test_gate_rejects_conflicting_replay(gate_contract, direct_vm, direct_owner, direct_alice):
    gate = gate_contract
    direct_vm.sender = direct_owner
    gate.configure_arena(as_address(direct_alice))
    direct_vm.sender = as_address(direct_alice)
    args = (
        "silver-2025-01-01-00-15-00Z",
        "REFUND",
        100,
        0,
        2_000_000_000,
        2_000_000_000,
        "https://metal-arena.vercel.app/evidence/silver-2025-01-01-00-15-00Z.json",
        "",
    )
    gate.record_finality(*args)
    with direct_vm.expect_revert("finality record conflicts"):
        gate.record_finality(
            "silver-2025-01-01-00-15-00Z",
            "DOWN",
            100,
            0,
            2_000_000_000,
            2_000_000_000,
            "https://metal-arena.vercel.app/evidence/silver-2025-01-01-00-15-00Z.json",
            "",
        )
