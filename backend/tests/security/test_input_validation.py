"""Tests for input validation and sanitization utilities."""

import pytest

from app.security.input_validation import (
    detect_sql_injection,
    detect_xss,
    sanitize_dict,
    sanitize_filename,
    sanitize_html,
    sanitize_search_query,
    validate_email_format,
    validate_integer_range,
)


class TestSanitizeHTML:
    """Tests for HTML sanitization."""

    def test_sanitize_html_escapes_basic_tags(self):
        """Test that basic HTML tags are escaped."""
        assert sanitize_html("<script>alert('xss')</script>") == "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
        assert sanitize_html("<b>bold</b>") == "&lt;b&gt;bold&lt;/b&gt;"

    def test_sanitize_html_escapes_special_characters(self):
        """Test that special characters are escaped."""
        assert sanitize_html("Tom & Jerry") == "Tom &amp; Jerry"
        assert sanitize_html("a < b") == "a &lt; b"
        assert sanitize_html("x > y") == "x &gt; y"
        assert sanitize_html('quote="value"') == "quote=&quot;value&quot;"

    def test_sanitize_html_with_non_string_input(self):
        """Test sanitize_html with non-string input."""
        assert sanitize_html(123) == 123
        assert sanitize_html(None) is None

    def test_sanitize_html_empty_string(self):
        """Test sanitize_html with empty string."""
        assert sanitize_html("") == ""


class TestDetectSQLInjection:
    """Tests for SQL injection detection."""

    def test_detects_union_select(self):
        """Test detection of UNION SELECT injection."""
        assert detect_sql_injection("1 UNION SELECT * FROM users") is True
        assert detect_sql_injection("' UNION SELECT password FROM admin--") is True

    def test_detects_or_equals(self):
        """Test detection of OR 1=1 injection."""
        assert detect_sql_injection("admin' OR '1'='1") is True
        assert detect_sql_injection("' OR 1=1--") is True

    def test_detects_comment_injection(self):
        """Test detection of comment-based injection."""
        assert detect_sql_injection("admin';--") is True
        assert detect_sql_injection("/* comment */ SELECT") is True

    def test_detects_drop_table(self):
        """Test detection of DROP TABLE injection."""
        assert detect_sql_injection("'; DROP TABLE users;--") is True

    def test_allows_safe_input(self):
        """Test that safe input is not flagged."""
        assert detect_sql_injection("john.doe@example.com") is False
        assert detect_sql_injection("normal search query") is False
        assert detect_sql_injection("property-123") is False

    def test_with_non_string_input(self):
        """Test with non-string input."""
        assert detect_sql_injection(123) is False
        assert detect_sql_injection(None) is False


class TestDetectXSS:
    """Tests for XSS detection."""

    def test_detects_script_tags(self):
        """Test detection of script tags."""
        assert detect_xss("<script>alert('xss')</script>") is True
        assert detect_xss("<SCRIPT>alert('xss')</SCRIPT>") is True

    def test_detects_javascript_protocol(self):
        """Test detection of javascript: protocol."""
        assert detect_xss("javascript:alert('xss')") is True
        assert detect_xss("JAVASCRIPT:void(0)") is True

    def test_detects_event_handlers(self):
        """Test detection of event handlers."""
        assert detect_xss('<img onerror="alert(1)">') is True
        assert detect_xss('<body onload="malicious()">') is True
        assert detect_xss('<div onclick="hack()">') is True

    def test_detects_dangerous_tags(self):
        """Test detection of dangerous tags."""
        assert detect_xss("<iframe src='evil.com'>") is True
        assert detect_xss("<object data='malicious.swf'>") is True
        assert detect_xss("<embed src='bad.swf'>") is True

    def test_allows_safe_input(self):
        """Test that safe input is not flagged."""
        assert detect_xss("normal text") is False
        assert detect_xss("user@example.com") is False
        assert detect_xss("This is a <safe> description") is False  # Note: < and > alone aren't flagged

    def test_with_non_string_input(self):
        """Test with non-string input."""
        assert detect_xss(123) is False
        assert detect_xss(None) is False


class TestSanitizeFilename:
    """Tests for filename sanitization."""

    def test_removes_path_traversal(self):
        """Test removal of path traversal sequences."""
        result1 = sanitize_filename("../../../etc/passwd")
        result2 = sanitize_filename("..\\windows\\system32")
        # Slashes are replaced with underscores
        assert "/" not in result1 and "\\" not in result1
        assert ".." not in result1 and ".." not in result2

    def test_removes_special_characters(self):
        """Test removal of special characters."""
        assert sanitize_filename("file@#$%name.txt") == "file____name.txt"
        assert sanitize_filename("my file?.doc") == "my_file_.doc"

    def test_prevents_hidden_files(self):
        """Test prevention of hidden files."""
        assert sanitize_filename(".gitignore") == "_gitignore"
        assert sanitize_filename(".env") == "_env"

    def test_truncates_long_filenames(self):
        """Test truncation of long filenames."""
        long_name = "a" * 300 + ".txt"
        result = sanitize_filename(long_name)
        assert len(result) <= 255

    def test_allows_safe_filenames(self):
        """Test that safe filenames are preserved."""
        assert sanitize_filename("document.pdf") == "document.pdf"
        assert sanitize_filename("my-file_123.txt") == "my-file_123.txt"

    def test_with_non_string_input(self):
        """Test with non-string input."""
        assert sanitize_filename(123) == ""
        assert sanitize_filename(None) == ""


class TestValidateEmailFormat:
    """Tests for email format validation."""

    def test_validates_correct_emails(self):
        """Test validation of correct email formats."""
        assert validate_email_format("user@example.com") is True
        assert validate_email_format("test.user+tag@domain.co.uk") is True
        assert validate_email_format("admin@localhost.localdomain") is True

    def test_rejects_invalid_emails(self):
        """Test rejection of invalid email formats."""
        assert validate_email_format("invalid") is False
        assert validate_email_format("@example.com") is False
        assert validate_email_format("user@") is False
        assert validate_email_format("user@.com") is False
        assert validate_email_format("") is False

    def test_with_non_string_input(self):
        """Test with non-string input."""
        assert validate_email_format(123) is False
        assert validate_email_format(None) is False


class TestSanitizeSearchQuery:
    """Tests for search query sanitization."""

    def test_removes_excessive_whitespace(self):
        """Test removal of excessive whitespace."""
        assert sanitize_search_query("  too   many    spaces  ") == "too many spaces"

    def test_truncates_to_max_length(self):
        """Test truncation to maximum length."""
        long_query = "a" * 200
        result = sanitize_search_query(long_query, max_length=50)
        assert len(result) == 50

    def test_removes_dangerous_characters(self):
        """Test removal of potentially dangerous characters."""
        assert sanitize_search_query("search<script>") == "searchscript"
        assert sanitize_search_query("query;DROP") == "queryDROP"

    def test_allows_safe_punctuation(self):
        """Test that safe punctuation is preserved."""
        assert sanitize_search_query("user@example.com") == "user@example.com"
        assert sanitize_search_query("two-bedroom property") == "two-bedroom property"
        # Some punctuation like $ and : are removed
        result = sanitize_search_query("price: $1,000.00")
        assert "1000.00" in result or "1,000.00" in result  # Either is acceptable

    def test_with_non_string_input(self):
        """Test with non-string input."""
        assert sanitize_search_query(123) == ""
        assert sanitize_search_query(None) == ""


class TestValidateIntegerRange:
    """Tests for integer range validation."""

    def test_validates_within_range(self):
        """Test validation of integers within range."""
        assert validate_integer_range(5, min_value=1, max_value=10) is True
        assert validate_integer_range(1, min_value=1, max_value=10) is True
        assert validate_integer_range(10, min_value=1, max_value=10) is True

    def test_rejects_below_minimum(self):
        """Test rejection of values below minimum."""
        assert validate_integer_range(0, min_value=1, max_value=10) is False
        assert validate_integer_range(-5, min_value=1, max_value=10) is False

    def test_rejects_above_maximum(self):
        """Test rejection of values above maximum."""
        assert validate_integer_range(11, min_value=1, max_value=10) is False
        assert validate_integer_range(100, min_value=1, max_value=10) is False

    def test_validates_with_only_min(self):
        """Test validation with only minimum specified."""
        assert validate_integer_range(100, min_value=10) is True
        assert validate_integer_range(5, min_value=10) is False

    def test_validates_with_only_max(self):
        """Test validation with only maximum specified."""
        assert validate_integer_range(5, max_value=10) is True
        assert validate_integer_range(15, max_value=10) is False

    def test_rejects_non_integer_input(self):
        """Test rejection of non-integer input."""
        assert validate_integer_range("abc", min_value=1, max_value=10) is False
        assert validate_integer_range(None, min_value=1, max_value=10) is False


class TestSanitizeDict:
    """Tests for dictionary sanitization."""

    def test_sanitizes_string_values(self):
        """Test sanitization of string values in dict."""
        data = {"name": "<script>alert('xss')</script>", "age": 25}
        result = sanitize_dict(data)
        assert "&lt;script&gt;" in result["name"]
        assert result["age"] == 25

    def test_sanitizes_keys(self):
        """Test sanitization of dictionary keys."""
        data = {"user<script>": "value", "safe-key": "value"}
        result = sanitize_dict(data)
        # Keys should have special characters removed/replaced
        assert "user_script_" in result or "userscript" in result
        assert "safe-key" in result or "safe_key" in result

    def test_sanitizes_nested_dicts(self):
        """Test recursive sanitization of nested dictionaries."""
        data = {
            "user": {
                "name": "<b>John</b>",
                "email": "john@example.com"
            }
        }
        result = sanitize_dict(data)
        assert "&lt;b&gt;" in result["user"]["name"]

    def test_sanitizes_lists_with_dicts(self):
        """Test sanitization of lists containing dictionaries."""
        data = {
            "users": [
                {"name": "<script>hack</script>"},
                {"name": "safe name"}
            ]
        }
        result = sanitize_dict(data)
        assert "&lt;script&gt;" in result["users"][0]["name"]

    def test_preserves_non_string_values(self):
        """Test that non-string values are preserved."""
        data = {
            "count": 42,
            "active": True,
            "score": 3.14,
            "tags": ["tag1", "tag2"]
        }
        result = sanitize_dict(data)
        assert result["count"] == 42
        assert result["active"] is True
        assert result["score"] == 3.14

    def test_with_sanitize_values_false(self):
        """Test with sanitize_values=False."""
        data = {"name": "<script>test</script>"}
        result = sanitize_dict(data, sanitize_values=False)
        # Keys should still be sanitized, but not values
        assert "<script>" in result["name"]
