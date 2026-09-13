import json

from tests.direct.conftest import as_address, evidence_payload, market_id


BASE = "https://metal-arena.vercel.app/evidence/"


def open_gold(arena, direct_vm, start="2025-01-01T00:15:00Z"):
    direct_vm.warp("2025-01-01T00:00:00Z")
    identifier = market_id(start)
    arena.open_market("GOLD", start, f"{BASE}{identifier}.json")
    return identifier


def fund_and_stake(arena, direct_vm, address, market, side, amount):
    direct_vm.sender = address
    arena.claim_demo_credits()
    arena.place_stake(market, side, amount)


def settle_with(arena, direct_vm, direct_alice, market, payload):
    direct_vm.mock_web(
        rf".*{market}\.json$",
        {"status": 200, "body": json.dumps(payload)},
    )
    direct_vm.warp("2025-01-01T00:30:00Z")
    direct_vm.sender = direct_alice
    arena.request_settlement(market)


def test_gold_market_lifecycle_and_up_payout_conserves_pool(
    wired_arena, direct_vm, direct_alice, direct_bob
):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 300)
    fund_and_stake(arena, direct_vm, direct_bob, market, "DOWN", 100)
    payload = evidence_payload(market, "2025-01-01T00:15:00Z", "2025-01-01T00:30:00Z")
    settle_with(arena, direct_vm, direct_alice, market, payload)

    detail = arena.get_market(market)
    assert detail["outcome"] == "UP"
    assert detail["fee_amount"] == 8
    assert detail["distributable_pool"] == 392
    assert detail["status"] == "AWAITING_FINALITY"
    assert arena.get_claim_quote(market, as_address(direct_alice), "UP")["payout"] == 392
    assert arena.get_claim_quote(market, as_address(direct_bob), "DOWN")["payout"] == 0
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("finality gate"):
        arena.claim(market, "UP")


def test_silver_uses_the_shared_market_rules_and_metadata(arena_contract, direct_vm, direct_alice):
    direct_vm.warp("2025-01-01T00:00:00Z")
    market = market_id("2025-01-01T00:15:00Z", metal="silver")
    arena_contract.open_market(
        "SILVER",
        "2025-01-01T00:15:00Z",
        f"{BASE}{market}.json",
    )
    detail = arena_contract.get_market(market)
    config = arena_contract.get_protocol_config()
    assert detail["metal"] == "SILVER"
    assert detail["instrument"] == "SYNTHETIC-XAGUSD-SPOT"
    assert detail["unit"] == "USD_PER_TROY_OUNCE"
    assert detail["fee_bps"] == config["fee_bps"] == 200
    assert detail["rule_version"] == config["rule_version"] == "synthetic-boundary-v1"
    assert detail["evidence_url"] == f"{BASE}{market}.json"


def test_down_wins_with_integer_floor_rounding(wired_arena, direct_vm, direct_alice, direct_bob):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 100)
    fund_and_stake(arena, direct_vm, direct_bob, market, "DOWN", 300)
    payload = evidence_payload(
        market,
        "2025-01-01T00:15:00Z",
        "2025-01-01T00:30:00Z",
        opening_price=2_100_000_000,
        closing_price=2_099_000_000,
    )
    settle_with(arena, direct_vm, direct_alice, market, payload)
    assert arena.get_market(market)["outcome"] == "DOWN"
    assert arena.get_claim_quote(market, as_address(direct_bob), "DOWN")["payout"] == 392


def test_equal_prices_refund_has_no_fee(wired_arena, direct_vm, direct_alice, direct_bob):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 200)
    fund_and_stake(arena, direct_vm, direct_bob, market, "DOWN", 100)
    payload = evidence_payload(
        market,
        "2025-01-01T00:15:00Z",
        "2025-01-01T00:30:00Z",
        opening_price=2_100_000_000,
        closing_price=2_100_000_000,
    )
    settle_with(arena, direct_vm, direct_alice, market, payload)
    assert arena.get_market(market)["outcome"] == "REFUND"
    assert arena.get_market(market)["fee_amount"] == 0
    assert arena.get_claim_quote(market, as_address(direct_alice), "UP")["payout"] == 200


def test_one_sided_pool_refunds_even_when_price_moves(wired_arena, direct_vm, direct_alice):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 250)
    payload = evidence_payload(market, "2025-01-01T00:15:00Z", "2025-01-01T00:30:00Z")
    settle_with(arena, direct_vm, direct_alice, market, payload)
    detail = arena.get_market(market)
    assert detail["outcome"] == "REFUND"
    assert detail["fee_amount"] == 0
    assert arena.get_claim_quote(market, as_address(direct_alice), "UP")["payout"] == 250


def test_cutoff_rejects_late_entry(arena_contract, direct_vm, direct_alice):
    market = open_gold(arena_contract, direct_vm)
    direct_vm.sender = direct_alice
    arena_contract.claim_demo_credits()
    direct_vm.warp("2025-01-01T00:15:00Z")
    with direct_vm.expect_revert("market entry is closed"):
        arena_contract.place_stake(market, "UP", 10)


def test_missing_evidence_is_pending_not_a_guessed_winner(wired_arena, direct_vm, direct_alice):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 100)
    direct_vm.mock_web(rf".*{market}\.json$", {"status": 404, "body": "not found"})
    direct_vm.warp("2025-01-01T00:30:00Z")
    direct_vm.sender = direct_alice
    arena.request_settlement(market)
    detail = arena.get_market(market)
    assert detail["outcome"] == ""
    assert detail["settlement_state"] == "PENDING_EVIDENCE"
    assert detail["last_reason_code"] == "FIXTURE_NOT_FOUND"


def test_conflicting_timestamp_is_pending(wired_arena, direct_vm, direct_alice):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "DOWN", 100)
    payload = evidence_payload(market, "2025-01-01T00:14:00Z", "2025-01-01T00:30:00Z")
    direct_vm.mock_web(rf".*{market}\.json$", {"status": 200, "body": json.dumps(payload)})
    direct_vm.warp("2025-01-01T00:30:00Z")
    direct_vm.sender = direct_alice
    arena.request_settlement(market)
    assert arena.get_market(market)["settlement_state"] == "PENDING_EVIDENCE"
    assert arena.get_market(market)["outcome"] == ""


def test_settlement_is_idempotent_after_outcome(wired_arena, direct_vm, direct_alice):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 100)
    payload = evidence_payload(market, "2025-01-01T00:15:00Z", "2025-01-01T00:30:00Z")
    settle_with(arena, direct_vm, direct_alice, market, payload)
    before = arena.get_market(market)
    direct_vm.sender = direct_alice
    arena.request_settlement(market)
    after = arena.get_market(market)
    assert after["outcome"] == before["outcome"]
    assert after["settlement_attempts"] == before["settlement_attempts"]


def test_user_position_pagination_keeps_both_sides_in_one_market(
    wired_arena, direct_vm, direct_alice
):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    direct_vm.sender = direct_alice
    arena.claim_demo_credits()
    arena.place_stake(market, "UP", 100)
    arena.place_stake(market, "DOWN", 50)

    first = arena.get_user_positions(as_address(direct_alice), 0, 1)
    second = arena.get_user_positions(as_address(direct_alice), first["next_offset"], 1)

    assert [position["side"] for position in first["positions"]] == ["UP"]
    assert [position["side"] for position in second["positions"]] == ["DOWN"]
    assert second["total_positions"] == 2
    assert second["has_more"] is False


def test_market_history_is_filtered_and_paginated_on_chain(arena_contract, direct_vm):
    direct_vm.warp("2025-01-01T00:00:00Z")
    first = market_id("2025-01-01T00:15:00Z")
    arena_contract.open_market("GOLD", "2025-01-01T00:15:00Z", f"{BASE}{first}.json")
    direct_vm.warp("2025-01-01T00:30:00Z")
    second = market_id("2025-01-01T00:45:00Z")
    arena_contract.open_market("GOLD", "2025-01-01T00:45:00Z", f"{BASE}{second}.json")

    first_page = arena_contract.get_market_ids_for_metal("GOLD", 0, 1)
    second_page = arena_contract.get_market_ids_for_metal("GOLD", first_page["next_offset"], 1)

    assert first_page["market_ids"] == [first]
    assert second_page["market_ids"] == [second]
    assert second_page["total"] == 2
    assert second_page["has_more"] is False


def test_next_market_is_rejected_until_previous_interval_ends(arena_contract, direct_vm):
    direct_vm.warp("2025-01-01T00:00:00Z")
    first = market_id("2025-01-01T00:15:00Z")
    arena_contract.open_market("GOLD", "2025-01-01T00:15:00Z", f"{BASE}{first}.json")
    direct_vm.warp("2025-01-01T00:10:00Z")
    with direct_vm.expect_revert("active market"):
        arena_contract.open_next_market("GOLD")

    direct_vm.warp("2025-01-01T00:30:00Z")
    arena_contract.open_next_market("GOLD")
    assert arena_contract.get_market_for_metal("GOLD")["market_id"] == market_id("2025-01-01T00:45:00Z")


def test_request_after_deadline_always_refunds_without_an_evidence_attempt(
    wired_arena, direct_vm, direct_alice, direct_bob
):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 100)
    fund_and_stake(arena, direct_vm, direct_bob, market, "DOWN", 100)
    payload = evidence_payload(market, "2025-01-01T00:15:00Z", "2025-01-01T00:30:00Z")
    direct_vm.mock_web(rf".*{market}\.json$", {"status": 200, "body": json.dumps(payload)})
    direct_vm.warp("2025-01-01T00:35:00Z")
    direct_vm.sender = direct_alice

    arena.request_settlement(market)
    detail = arena.get_market(market)

    assert detail["outcome"] == "REFUND"
    assert detail["last_reason_code"] == "SETTLEMENT_DEADLINE_REFUND"
    assert detail["settlement_attempts"] == 0
    assert detail["fee_amount"] == 0


def test_oversized_evidence_body_stays_pending(wired_arena, direct_vm, direct_alice):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 100)
    direct_vm.mock_web(rf".*{market}\.json$", {"status": 200, "body": "x" * 20_000})
    direct_vm.warp("2025-01-01T00:30:00Z")
    direct_vm.sender = direct_alice

    arena.request_settlement(market)

    detail = arena.get_market(market)
    assert detail["settlement_state"] == "PENDING_EVIDENCE"
    assert detail["last_reason_code"] == "EVIDENCE_TOO_LARGE"


def test_out_of_bounds_evidence_price_stays_pending(wired_arena, direct_vm, direct_alice):
    arena, _gate = wired_arena
    market = open_gold(arena, direct_vm)
    fund_and_stake(arena, direct_vm, direct_alice, market, "UP", 100)
    payload = evidence_payload(
        market,
        "2025-01-01T00:15:00Z",
        "2025-01-01T00:30:00Z",
        opening_price=10_000_000_000_001,
    )
    direct_vm.mock_web(rf".*{market}\.json$", {"status": 200, "body": json.dumps(payload)})
    direct_vm.warp("2025-01-01T00:30:00Z")
    direct_vm.sender = direct_alice

    arena.request_settlement(market)

    detail = arena.get_market(market)
    assert detail["settlement_state"] == "PENDING_EVIDENCE"
    assert detail["last_reason_code"] == "INVALID_SCHEMA"
