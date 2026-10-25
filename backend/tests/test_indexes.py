async def test_users_email_index_is_unique(db):
    info = await db.users.index_information()
    assert info["users_email_unique"]["unique"] is True
