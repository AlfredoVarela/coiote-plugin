/**
 * Created by alfredo on 11/10/16.
 */
module.exports.config = require('./plugin.json');
module.exports.name = module.exports.config.name;
module.exports.statics = module.exports.config.statics;
module.exports.routes = module.exports.config.routes;


module.exports.init = function (conf) {


};
