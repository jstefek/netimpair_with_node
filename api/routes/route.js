'use strict';

module.exports = function (app) {
    var controller = require('../controllers/controller');

    app.route('/netimpair').get(controller.netimpair);
};