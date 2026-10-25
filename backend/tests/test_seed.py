from scripts.seed_catalog import FACILITIES, SPORTS, seed


async def test_seed_creates_catalog_and_is_idempotent(db):
    first = await seed(db)
    assert first == {"sports": len(SPORTS), "facilities": len(FACILITIES)}

    second = await seed(db)
    assert second == {"sports": 0, "facilities": 0}
    assert await db.sports.count_documents({}) == len(SPORTS)
    assert await db.facilities.count_documents({}) == len(FACILITIES)
