'use strict';

module.exports = function (app) {
    var controller = require('../controllers/controller');

    app.route('/netimpair/isActive').get(controller.isActive);
    app.route('/netimpair/activate').get(controller.activate);
    app.route('/netimpair/deactivate').get(controller.deactivate);
};