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
