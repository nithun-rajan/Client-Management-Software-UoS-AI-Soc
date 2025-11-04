"""Unit tests for PropertyMatcher helpers (no DB required)."""

from datetime import date, timedelta, timezone, datetime

from app.api.v1.property_matching import PropertyMatcher
from app.models.applicant import Applicant
from app.models.property import Property


def make_property(**overrides) -> Property:
    defaults = {
        "address": "1 Test Street",
        "city": "Testville",
        "postcode": "SO15 2AB",
        "property_type": "flat",
        "bedrooms": 2,
        "bathrooms": 1,
        "rent": 1200.0,
        "features": None,
    }
    defaults.update(overrides)
    return Property(**defaults)


def make_applicant(**overrides) -> Applicant:
    defaults = {
        "first_name": "Alice",
        "last_name": "Test",
        "email": "alice@example.com",
        "phone": "01234567890",
        "desired_bedrooms": "2",
        "desired_property_type": "flat",
        "rent_budget_min": 1000.0,
        "rent_budget_max": 1300.0,
        "preferred_locations": "SO15, SO16",
        "move_in_date": None,
        "has_pets": False,
        "pet_details": None,
        "special_requirements": None,
    }
    defaults.update(overrides)
    return Applicant(**defaults)


class TestOpeningMessage:
    def test_opening_message_thresholds(self):
        assert "amazing" in PropertyMatcher._generate_opening_message(95).lower()
        assert "love" in PropertyMatcher._generate_opening_message(80).lower()
        assert "might be" in PropertyMatcher._generate_opening_message(50).lower()


class TestMoveInDateScore:
    def test_move_in_date_urgent(self):
        app = make_applicant(move_in_date=(datetime.now(timezone.utc) + timedelta(days=10)).date())
        score, max_score = PropertyMatcher._calculate_move_in_date_score(app)
        assert score == 10 and max_score == 10

    def test_move_in_date_soon(self):
        app = make_applicant(move_in_date=(datetime.now(timezone.utc) + timedelta(days=40)).date())
        score, max_score = PropertyMatcher._calculate_move_in_date_score(app)
        assert score == 5 and max_score == 10

    def test_move_in_date_far(self):
        app = make_applicant(move_in_date=(date.today() + timedelta(days=100)))
        score, _ = PropertyMatcher._calculate_move_in_date_score(app)
        assert score == 0


class TestRentScore:
    def test_rent_within_budget(self):
        prop = make_property(rent=1200)
        app = make_applicant(rent_budget_min=1000, rent_budget_max=1300)
        score, max_score = PropertyMatcher._calculate_rent_score(prop, app)
        assert score == 25 and max_score == 25

    def test_rent_slightly_above_max_budget(self):
        prop = make_property(rent=1080)
        app = make_applicant(rent_budget_min=None, rent_budget_max=1000)
        score, _ = PropertyMatcher._calculate_rent_score(prop, app)
        assert score == 15


class TestPetAndHighlights:
    def test_pet_message_with_garden(self):
        prop = make_property(features="garden")
        app = make_applicant(has_pets=True, pet_details="a small dog")
        msg = PropertyMatcher._generate_pet_message(prop, app).lower()
        assert "garden" in msg and "dog" in msg

    def test_highlights_from_features_list(self):
        prop = make_property(features='["garden", "balcony"]')
        msg = PropertyMatcher._generate_highlights_message(prop)
        assert "Features:" in msg and "garden" in msg


class TestOverallScore:
    def test_calculate_match_score_in_range(self):
        prop = make_property(rent=1200)
        app = make_applicant(move_in_date=(date.today() + timedelta(days=5)))
        score = PropertyMatcher.calculate_match_score(prop, app)
        assert 0 <= score <= 100
