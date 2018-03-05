var keystone = require('keystone');

var Account = new keystone.List('Account');

Account.add({
    displayName: {
        type: String
    },
    email: {
        type: keystone.Field.Types.Email,
        unique: true
    },
    password: {
        type: keystone.Field.Types.Password
    },
});

Account.schema.virtual('canAccessKeystone').get(function () {
    return true;
});

Account.defaultColumns = 'id, displayName, email';

Account.register();