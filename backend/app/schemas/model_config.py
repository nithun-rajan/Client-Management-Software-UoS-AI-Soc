from pydantic import BaseModel, ConfigDict

class AppBaseModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,  # For ORM compatibility
        arbitrary_types_allowed=True,  # For custom types/enums
        use_enum_values=True,  # Serialize enums to their values
        str_strip_whitespace=True,  # Auto-strip string whitespace
        validate_assignment=True  # Validate on attribute assignment
    )