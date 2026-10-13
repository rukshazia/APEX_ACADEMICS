import io
import pytest
from app.services.excel_parser import guess_column_mapping, parse_and_validate_records

def test_column_mapping_guesses():
    headers = ["Roll No", "Student Name", "Email Address", "Branch", "Sem", "CGPA"]
    mapping = guess_column_mapping(headers)
    assert mapping["roll_number"] == "Roll No"
    assert mapping["full_name"] == "Student Name"
    assert mapping["email"] == "Email Address"
    assert mapping["department_code"] == "Branch"

def test_csv_validation_and_duplicate_detection():
    csv_data = (
        "Roll No,Student Name,Email,Semester,CGPA\n"
        "STU001,John Doe,john@test.edu,4,8.5\n"
        "STU001,John Duplicate,john_dup@test.edu,4,7.0\n" # Duplicate roll within file
        "STU002,Jane Smith,bad_email,4,9.0\n" # Invalid email format
        "STU003,Bob Wilson,bob@test.edu,15,8.0\n" # Semester out of bounds
    ).encode("utf-8")

    col_mapping = {
        "roll_number": "Roll No",
        "full_name": "Student Name",
        "email": "Email",
        "semester": "Semester",
        "cgpa": "CGPA"
    }

    result = parse_and_validate_records(
        file_bytes=csv_data,
        filename="test.csv",
        sheet_name=None,
        column_mapping=col_mapping,
        existing_rolls=set(),
        existing_emails=set()
    )

    assert result["create_count"] == 1 # Only STU001 is valid
    assert result["rejected_count"] == 3 # Duplicate roll, bad email, bad sem
