'use strict';

module.exports = function (app) {
    var controller = require('../controllers/controller');

    app.route('/netimpair/isActive').get(controller.isActive);
    app.route('/netimpair/isRouting').get(controller.isRouting);
    app.route('/netimpair/activate').get(controller.activate);
    app.route('/netimpair/deactivate').get(controller.deactivate);
    app.route('/netimpair/startRouting').get(controller.startRouting);
    app.route('/netimpair/stopRouting').get(controller.stopRouting);
    app.route('/networkInterfaces').get(controller.networkInterfaces);
};
