// //helper methods for overriding JSONForm rendering
// var arrayFieldTemplates = [
//     'text', 'password', 'date', 'datetime', 'datetime-local', 'email', 'month', 'number', 'search', 'tel', 'time', 'url', 'week', 'checkbox', 'fieldset'];
// arrayFieldTemplates.forEach((id) => {
//     var o = _.clone(JSONForm.fieldTypes[id]);
//     o.fieldtemplate = false; //this wraps boilerplate wrapping
//     JSONForm.fieldTypes['table' + id] = o;
// });


function getParentType(node){
    var type = null;
    if (node && node.parentNode && node.parentNode.schemaElement){
        type = node.parentNode.schemaElement.type
    }
    return type;
}


var tests = [
    {
        name: 'tablearray',
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
                        },
                        "repaymentType": {
                            "type": "array",
                            "id": "http://jsonschema.net/config-repayment-products/repaymentType",
                            "required": true,
                            "items": {
                                "type": "object",
                                "id": "http://jsonschema.net/config-repayment-products/repaymentType/0",
                                "required": true,
                                "properties": {
                                    "id": {
                                        "type": "string",
                                        "id": "http://jsonschema.net/config-repayment-products/repaymentType/0/id",
                                        "required": true,
                                        "title": "Id"
                                    },
                                    "label": {
                                        "type": "string",
                                        "id": "http://jsonschema.net/config-repayment-products/repaymentType/0/label",
                                        "required": true,
                                        "title": "Label"
                                    },
                                    "interestOnly": {
                                        "type": "boolean",
                                        "id": "http://jsonschema.net/config-repayment-products/repaymentType/0/interestOnly",
                                        "required": true,
                                        "title": "Interest Only"
                                    }
                                },
                                "additionalProperties": false
                            },
                            "title": "Repayment Type"
                        }
                    },
                    "title": "Config-repayment-products",
                    "additionalProperties": false
                }
            },
            
            
            /**
             * Taken from `widget-manager` - render as tablearray and tableobject
             * 
             * data: data sent to tpl when rendered (schema ele, form ele)
             * node: form node instance - view representation of a schema element
             */
            onBeforeRender: function (data, node) {
    
                if (node.formElement && node.formElement.type == 'fieldset'
                    && node.parentNode && node.parentNode.formElement && node.parentNode.formElement.type == 'selectfieldset') {
                    if (data.elt.htmlClass) {
                        data.elt.htmlClass += " expanded";
                    } else {
                        data.elt.htmlClass = " expanded";
                    }
                }
    
                if (!node.schemaElement) {
                    return;
                }
                //is it an object filled array - leave alone if scalar-filled array
                if (node.schemaElement.type == 'array' && node.schemaElement.items && node.schemaElement.items.type == 'object') {
                    node.view = JSONForm.fieldTypes['tablearray'];
        
                } else if (node.schemaElement.type == 'object' && getParentType(node) == 'array') {
                    // Object item in an array.
                    node.view = JSONForm.fieldTypes['tableobject'];
        
                } else if (getParentType(node.parentNode) == 'array' && getParentType(node) == 'object') {
                    // Sub-property of the object item in an array.
                    // The parent is an object on an array.
        
                    // Get the view type.
                    var type = node.formElement.type;
                    var newView = JSONForm.fieldTypes['table' + type]; //no boilerplate
                    if (newView) {
                        node.view = newView;
                    }
                }
            },  // end `onBeforeRender(...)`
            
            
        }
    }
];

addTests(tests, 'tablearray');
