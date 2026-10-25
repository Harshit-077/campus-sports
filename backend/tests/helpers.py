TEST_JWT_SECRET = "test-secret-do-not-use-anywhere-else-0123456789"
DEFAULT_PASSWORD = "correct-horse-battery"


async def register(client, email="student@campus.edu", password=DEFAULT_PASSWORD,
                   name="Test Student", **extra):
    return await client.post(
        "/api/v1/auth/register",
        json={"name": name, "email": email, "password": password, **extra},
    )


async def login(client, email="student@campus.edu", password=DEFAULT_PASSWORD):
    # Login uses the OAuth2 password flow: form-encoded, `username` holds the email.
    return await client.post(
        "/api/v1/auth/login", data={"username": email, "password": password}
    )


async def register_and_login(client, email="student@campus.edu", password=DEFAULT_PASSWORD):
    """Returns (token, user_dict)."""
    reg = await register(client, email=email, password=password)
    assert reg.status_code == 201, reg.text
    resp = await login(client, email=email, password=password)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    return body["access_token"], body["user"]


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ------------------------------------------------------------------ catalog helpers
BADMINTON_ATTRS = [
    {"key": "surface", "label": "Surface", "type": "enum",
     "options": ["wooden", "synthetic", "cement"], "required": True},
    {"key": "air_conditioning", "label": "Air conditioning", "type": "boolean"},
    {"key": "courts", "label": "Number of courts", "type": "number"},
    {"key": "notes", "label": "Notes", "type": "string"},
]
WEEKDAY_HOURS = {
    day: [{"open": "06:00", "close": "21:00"}] for day in ("mon", "tue", "wed", "thu", "fri")
}


async def create_sport(client, headers, name="Badminton", category="racquet",
                       attributes=None, **extra):
    payload = {
        "name": name,
        "category": category,
        "attributes": BADMINTON_ATTRS if attributes is None else attributes,
        **extra,
    }
    return await client.post("/api/v1/sports", json=payload, headers=headers)


async def create_facility(client, headers, sport_id, name="Badminton Court 1",
                          metadata=None, **extra):
    payload = {
        "name": name,
        "sport_id": sport_id,
        "location": "Sports Complex, Block A",
        "metadata": {"surface": "wooden", "air_conditioning": True} if metadata is None else metadata,
        "operating_hours": WEEKDAY_HOURS,
        **extra,
    }
    return await client.post("/api/v1/facilities", json=payload, headers=headers)


# ------------------------------------------------------------------ booking helpers
# The fake clock starts on Monday 2026-11-02 09:30 IST (04:00 UTC).
MON, TUE, WED, SAT = "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-07"


def at(day: str, hhmm: str) -> str:
    """Campus-local (IST) wall-clock time as an ISO string with offset."""
    return f"{day}T{hhmm}:00+05:30"


async def make_student(client, n: int) -> dict[str, str]:
    token, _ = await register_and_login(client, email=f"student{n}@campus.edu")
    return bearer(token)


async def book(client, headers, facility_id, start):
    return await client.post(
        "/api/v1/bookings", json={"facility_id": facility_id, "start": start}, headers=headers
    )


async def cancel(client, headers, booking_id, reason=None):
    return await client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=headers,
        json={"reason": reason} if reason else None,
    )


async def slots(client, facility_id, day, headers=None):
    return await client.get(
        f"/api/v1/facilities/{facility_id}/slots", params={"date": day}, headers=headers
    )
