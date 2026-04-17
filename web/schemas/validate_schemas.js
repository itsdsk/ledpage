const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = require('./config.json');

const validate = ajv.compile(schema);

let config_schema_tests = [
    'config_simple.json',
    'config_invalid_missing_outputs.json',
    'config_invalid_output_property.json',
    'config_invalid_output_type.json',
    'config_invalid_output_colorOrder.json'
];

config_schema_tests.forEach( n => {
    console.log(`Testing config schema on ${n}`);
    let this_test = require(`./test/${n}`);
    const valid = validate(this_test);
    if (valid) {
        console.log('Valid');
    } else {
        console.log('Invalid:')
        console.log(validate.errors);
    }
})