
"""
Enterprise Input Validation API
Enhanced: Advanced file upload validation, nested data checks, enterprise logging, batch validation, and configurable rules
"""

from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from pydantic import BaseModel, ValidationError
from typing import Dict, Any, List, Optional
import re
import logging

router = APIRouter(prefix="/input-validation", tags=["Input Validation"])
logger = logging.getLogger("input_validation")

class InputData(BaseModel):
	data: Dict[str, Any]

class BatchInput(BaseModel):
	batch: List[Dict[str, Any]]

class ValidationRule(BaseModel):
	field: str
	regex: Optional[str] = None
	required: bool = True

def is_sql_injection(value: str) -> bool:
	patterns = [
		r"(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)",
		r"(--|#|/\*|\*/)",
		r"(OR\b.*=.*\bOR)",
		r"(AND\b.*=.*\bAND)"
	]
	return any(re.search(pattern, value, re.IGNORECASE) for pattern in patterns)

def is_xss(value: str) -> bool:
	patterns = [
		r"<script[^>]*>.*?</script>",
		r"javascript:",
		r"on\w+\s*=",
		r"<iframe[^>]*>.*?</iframe>"
	]
	return any(re.search(pattern, value, re.IGNORECASE) for pattern in patterns)

def validate_nested(data: Any, errors: Dict[str, str], prefix: str = ""):
	if isinstance(data, dict):
		for k, v in data.items():
			validate_nested(v, errors, f"{prefix}.{k}" if prefix else k)
	elif isinstance(data, list):
		for idx, item in enumerate(data):
			validate_nested(item, errors, f"{prefix}[{idx}]")
	elif isinstance(data, str):
		if is_sql_injection(data):
			errors[prefix] = "SQL injection detected"
		elif is_xss(data):
			errors[prefix] = "XSS detected"

@router.post("/validate")
async def validate_input(input_data: InputData):
	errors = {}
	validate_nested(input_data.data, errors)
	logger.info(f"Validation attempt: {input_data.data}, errors: {errors}")
	if errors:
		raise HTTPException(status_code=400, detail=errors)
	return {"valid": True, "message": "Input is clean"}

@router.post("/batch-validate")
async def batch_validate(batch: BatchInput):
	results = []
	for item in batch.batch:
		errors = {}
		validate_nested(item, errors)
		results.append({"input": item, "errors": errors})
	logger.info(f"Batch validation: {results}")
	return {"results": results}

@router.post("/validate-file")
async def validate_file(file: UploadFile = File(...)):
	content = await file.read()
	errors = {}
	# Example: check file size and extension
	if file.content_type not in ["text/plain", "application/json"]:
		errors["type"] = "Invalid file type"
	if len(content) > 2 * 1024 * 1024:
		errors["size"] = "File too large"
	# Example: scan for SQL/XSS in text files
	if file.content_type == "text/plain":
		text = content.decode("utf-8", errors="ignore")
		if is_sql_injection(text):
			errors["content"] = "SQL injection detected"
		if is_xss(text):
			errors["content"] = "XSS detected"
	logger.info(f"File validation: {file.filename}, errors: {errors}")
	if errors:
		raise HTTPException(status_code=400, detail=errors)
	return {"valid": True, "filename": file.filename}

@router.post("/sanitize")
async def sanitize_input(input_data: InputData):
	sanitized = {}
	for key, value in input_data.data.items():
		if isinstance(value, str):
			value = re.sub(r"<.*?>", "", value)  # Remove HTML tags
			value = re.sub(r"(--|#|/\*|\*/)", "", value)  # Remove SQL comments
		sanitized[key] = value
	logger.info(f"Sanitized input: {sanitized}")
	return {"sanitized": sanitized}

@router.post("/validate-with-rules")
async def validate_with_rules(input_data: InputData, rules: List[ValidationRule]):
	errors = {}
	for rule in rules:
		value = input_data.data.get(rule.field)
		if rule.required and value is None:
			errors[rule.field] = "Field required"
		if rule.regex and value and not re.match(rule.regex, str(value)):
			errors[rule.field] = f"Value does not match rule: {rule.regex}"
	logger.info(f"Rule-based validation: {input_data.data}, rules: {rules}, errors: {errors}")
	if errors:
		raise HTTPException(status_code=400, detail=errors)
	return {"valid": True, "message": "Input matches all rules"}
