var tests = [
    {
        name: 'json',
        jsonform: {
            schema: {
                "config-repayment-products": {
                    "type": "object",
                    "id": "http://jsonschema.net/config-repayment-products",
                    "required": true,
                    "properties": {
                        "VERSION": {
                            "type": "number",
                            "id": "http://jsonschema.net/config-repayment-products/VERSION",
                            "required": true,
                            "title": "VERSION",
                            "default": 3,
                            "readOnly": true
                        },
                        "products": {
                            "type": "array",
                            "id": "http://jsonschema.net/config-repayment-products/products",
                            "required": false,
                            "items": {
                                "type": "object",
                                "id": "http://jsonschema.net/config-repayment-products/products/0",
                                "required": true,
                                "properties": {
                                    "id": {
                                        "type": "string",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/id",
                                        "required": true,
                                        "title": "Id"
                                    },
                                    "name": {
                                        "type": "string",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/name",
                                        "required": true,
                                        "title": "Name"
                                    },
                                    "features": {
                                        "type": "object",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/features",
                                        "required": false,
                                        "properties": {
                                            "repaymentType": {
                                                "type": "string",
                                                "id": "http://jsonschema.net/config-repayment-products/products/0/features/repaymentType",
                                                "required": true,
                                                "title": "Repayment Type",
                                                "default": "PI_IO",
                                                "enum": [
                                                    "PI_IO",
                                                    "PI_ONLY",
                                                    "IO_ONLY"
                                                ]
                                            },
                                            "termType": {
                                                "type": "string",
                                                "id": "http://jsonschema.net/config-repayment-products/products/0/features/termType",
                                                "required": false,
                                                "title": "Term Type",
                                                "default": "rangeTerm",
                                                "enum": [
                                                    "rangeTerm",
                                                    "exactTerm"
                                                ]
                                            }
                                        },
                                        "title": "Features",
                                        "additionalProperties": false
                                    },
                                    "fee": {
                                        "type": "object",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/fee",
                                        "required": true,
                                        "properties": {
                                            "initial": {
                                                "type": "number",
                                                "id": "http://jsonschema.net/config-repayment-products/products/0/fee/initial",
                                                "required": true,
                                                "title": "Initial"
                                            },
                                            "discharge": {
                                                "type": "number",
                                                "id": "http://jsonschema.net/config-repayment-products/products/0/fee/discharge",
                                                "required": true,
                                                "title": "Discharge"
                                            },
                                            "monthly": {
                                                "type": "number",
                                                "id": "http://jsonschema.net/config-repayment-products/products/0/fee/monthly",
                                                "required": true,
                                                "title": "Monthly"
                                            },
                                            "annual": {
                                                "type": "number",
                                                "id": "http://jsonschema.net/config-repayment-products/products/0/fee/annual",
                                                "required": true,
                                                "title": "Annual"
                                            }
                                        },
                                        "title": "Fee",
                                        "additionalProperties": false
                                    },
                                    "limits": {
                                        "type": "array",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/limits",
                                        "required": false,
                                        "items": {
                                            "type": "object",
                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0",
                                            "required": true,
                                            "properties": {
                                                "loanRange": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/loanRange",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/loanRange/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "minimum": -1,
                                                            "default": -1
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/loanRange/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "minimum": -1,
                                                            "default": -1
                                                        }
                                                    },
                                                    "title": "Loan Range",
                                                    "additionalProperties": false
                                                },
                                                "term": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/term",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": [
                                                                "string",
                                                                "number"
                                                            ],
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/term/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "minimum": -1,
                                                            "default": -1,
                                                            "pattern": "^((-1)$|(\\d+\\.?\\d*)\\s*(y|m|$))"
                                                        },
                                                        "max": {
                                                            "type": [
                                                                "string",
                                                                "number"
                                                            ],
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/term/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "minimum": -1,
                                                            "default": -1,
                                                            "pattern": "^((-1)$|(\\d+\\.?\\d*)\\s*(y|m|$))"
                                                        }
                                                    },
                                                    "title": "Term",
                                                    "additionalProperties": false
                                                },
                                                "lvr": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvr",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvr/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "minimum": -1,
                                                            "default": -1
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvr/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "minimum": -1,
                                                            "default": -1
                                                        },
                                                        "defaultValue": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvr/defaultValue",
                                                            "required": true,
                                                            "title": "Default Value",
                                                            "minimum": -1,
                                                            "default": -1
                                                        }
                                                    },
                                                    "title": "Lvr",
                                                    "additionalProperties": false
                                                },
                                                "lvrSoft": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvrSoft",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvrSoft/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "minimum": -1,
                                                            "default": 0
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/lvrSoft/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "minimum": -1,
                                                            "default": 1
                                                        }
                                                    },
                                                    "title": "Lvr Soft",
                                                    "additionalProperties": false
                                                },
                                                "propertyPrice": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/propertyPrice",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/propertyPrice/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "minimum": -1,
                                                            "default": -1
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/limits/0/propertyPrice/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "minimum": -1,
                                                            "default": -1
                                                        }
                                                    },
                                                    "title": "Property Price",
                                                    "additionalProperties": false
                                                }
                                            },
                                            "additionalProperties": false
                                        },
                                        "title": "Limits",
                                        "minItems": 0,
                                        "maxItems": 1
                                    },
                                    "rateDefaults": {
                                        "type": "array",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults",
                                        "required": false,
                                        "items": {
                                            "type": "object",
                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0",
                                            "required": true,
                                            "properties": {
                                                "loanRange": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/loanRange",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/loanRange/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "default": 0,
                                                            "minimum": -1,
                                                            "maximum": 999999999
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/loanRange/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "default": 999999999,
                                                            "minimum": -1,
                                                            "maximum": 999999999
                                                        }
                                                    },
                                                    "title": "Loan Range",
                                                    "additionalProperties": false
                                                },
                                                "term": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/term",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": [
                                                                "string",
                                                                "number"
                                                            ],
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/term/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "pattern": "^((-1)$|(\\d+\\.?\\d*)\\s*(y|m|$))",
                                                            "default": 1,
                                                            "minimum": -1,
                                                            "maximum": 99
                                                        },
                                                        "max": {
                                                            "type": [
                                                                "string",
                                                                "number"
                                                            ],
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/term/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "pattern": "^((-1)$|(\\d+\\.?\\d*)\\s*(y|m|$))",
                                                            "default": 30,
                                                            "minimum": -1,
                                                            "maximum": 99
                                                        }
                                                    },
                                                    "title": "Term",
                                                    "additionalProperties": false
                                                },
                                                "lvr": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/lvr",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/lvr/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "default": 0,
                                                            "minimum": -1,
                                                            "maximum": 1
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/lvr/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "default": 1,
                                                            "minimum": -1,
                                                            "maximum": 1
                                                        }
                                                    },
                                                    "title": "Lvr",
                                                    "additionalProperties": false
                                                },
                                                "features": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/features",
                                                    "required": true,
                                                    "properties": {
                                                        "extraRepayment": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/features/extraRepayment",
                                                            "required": true,
                                                            "title": "Extra Repayment",
                                                            "default": -1
                                                        },
                                                        "offset": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/features/offset",
                                                            "required": true,
                                                            "title": "Offset",
                                                            "minimum": -1,
                                                            "maximum": 1,
                                                            "default": 1
                                                        }
                                                    },
                                                    "title": "Features",
                                                    "additionalProperties": false
                                                },
                                                "interestType": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/interestType",
                                                    "required": false,
                                                    "title": "Interest Type"
                                                },
                                                "repaymentType": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/repaymentType",
                                                    "required": false,
                                                    "title": "Repayment Type",
                                                    "default": "",
                                                    "enum": [
                                                        "",
                                                        "PI",
                                                        "IO_ARR"
                                                    ]
                                                },
                                                "rate": {
                                                    "type": "number",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/rate",
                                                    "required": true,
                                                    "title": "Rate",
                                                    "default": -1,
                                                    "minimum": -1,
                                                    "maximum": 1
                                                },
                                                "productId": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/productId",
                                                    "required": false,
                                                    "title": "Product Id"
                                                },
                                                "rateDiscount": {
                                                    "type": "number",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/rateDiscount",
                                                    "required": true,
                                                    "title": "Rate Discount",
                                                    "default": 0,
                                                    "minimum": -1,
                                                    "maximum": 1
                                                },
                                                "comparisonRate": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rateDefaults/0/comparisonRate",
                                                    "required": false,
                                                    "title": "Comparison Rate",
                                                    "default": "0% p.a."
                                                }
                                            },
                                            "additionalProperties": false
                                        },
                                        "title": "Rate Defaults",
                                        "minItems": 0,
                                        "maxItems": 1
                                    },
                                    "rates": {
                                        "type": "array",
                                        "id": "http://jsonschema.net/config-repayment-products/products/0/rates",
                                        "required": true,
                                        "items": {
                                            "type": "object",
                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0",
                                            "required": true,
                                            "properties": {
                                                "rateRefId": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/rateRefId",
                                                    "required": false,
                                                    "title": "Rate Ref Id"
                                                },
                                                "loanRange": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/loanRange",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/loanRange/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "default": -1
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/loanRange/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "default": -1
                                                        }
                                                    },
                                                    "title": "Loan Range",
                                                    "additionalProperties": false
                                                },
                                                "term": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/term",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": [
                                                                "string",
                                                                "number"
                                                            ],
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/term/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "pattern": "^((-1)$|(\\d+\\.?\\d*)\\s*(y|m|$))"
                                                        },
                                                        "max": {
                                                            "type": [
                                                                "string",
                                                                "number"
                                                            ],
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/term/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "pattern": "^((-1)$|(\\d+\\.?\\d*)\\s*(y|m|$))"
                                                        }
                                                    },
                                                    "title": "Term",
                                                    "additionalProperties": false
                                                },
                                                "lvr": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/lvr",
                                                    "required": true,
                                                    "properties": {
                                                        "min": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/lvr/min",
                                                            "required": true,
                                                            "title": "Min",
                                                            "minimum": -1,
                                                            "maximum": 1,
                                                            "default": -1
                                                        },
                                                        "max": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/lvr/max",
                                                            "required": true,
                                                            "title": "Max",
                                                            "minimum": -1,
                                                            "maximum": 1,
                                                            "default": -1
                                                        }
                                                    },
                                                    "title": "Lvr",
                                                    "additionalProperties": false
                                                },
                                                "features": {
                                                    "type": "object",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/features",
                                                    "required": true,
                                                    "properties": {
                                                        "extraRepayment": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/features/extraRepayment",
                                                            "required": true,
                                                            "title": "Extra Repayment",
                                                            "default": -1
                                                        },
                                                        "offset": {
                                                            "type": "number",
                                                            "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/features/offset",
                                                            "required": true,
                                                            "title": "Offset",
                                                            "minimum": -1,
                                                            "maximum": 1,
                                                            "default": -1
                                                        }
                                                    },
                                                    "title": "Features",
                                                    "additionalProperties": false
                                                },
                                                "interestType": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/interestType",
                                                    "required": false,
                                                    "title": "Interest Type"
                                                },
                                                "repaymentType": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/repaymentType",
                                                    "required": false,
                                                    "title": "Repayment Type",
                                                    "default": "",
                                                    "enum": [
                                                        "",
                                                        "PI",
                                                        "PI_ADV",
                                                        "IO_ARR"
                                                    ]
                                                },
                                                "rate": {
                                                    "type": "number",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/rate",
                                                    "required": true,
                                                    "title": "Rate",
                                                    "default": -1,
                                                    "minimum": -1,
                                                    "maximum": 1
                                                },
                                                "productId": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/productId",
                                                    "required": false,
                                                    "title": "Product Id"
                                                },
                                                "rateDiscount": {
                                                    "type": "number",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/rateDiscount",
                                                    "required": false,
                                                    "title": "Rate Discount",
                                                    "minimum": -1,
                                                    "maximum": 1
                                                },
                                                "comparisonRate": {
                                                    "type": "string",
                                                    "id": "http://jsonschema.net/config-repayment-products/products/0/rates/0/comparisonRate",
                                                    "required": false,
                                                    "title": "Comparison Rate",
                                                    "default": "0% p.a."
                                                }
                                            },
                                            "additionalProperties": false
                                        },
                                        "title": "Rates"
                                    }
                                },
                                "additionalProperties": false
                            },
                            "title": "Products",
                            "minItems": 0
                        }
                    },
                    "title": "Config-repayment-products",
                    "additionalProperties": false
                }
            },
        }
    }
];

addTests(tests, 'json');
