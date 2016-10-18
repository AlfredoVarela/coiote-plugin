/**
 * Created by alfredo on 11/10/16.
 */
var injector = require('route-injector');
var crc = require('crc');
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();


var ADDRESS = "E0:D7:BA:A7:F1:5D";
var results = [];
var is_stopping = false;

module.exports.route = function (router) {
    router.get('/coiote/media', function (req, res) {
        connect(function (media) {
            injector.log.info("Tu HR media = " + media);
            res.json(media)
        });
    });

};

function connect(callback) {
    var socket = btSerial.on('found', function (address) {
        if (address == ADDRESS) {
            btSerial.findSerialPortChannel(address, function (channel) {
                btSerial.connect(address, channel, function () {
                    injector.log.info('connected to ' + address);
                    btSerial.on('data', function (buffer) {
                        decode(buffer);
                    });
                    listener(socket, function (res) {
                        callback(res);
                    });
                }, function () {
                    injector.log.error('cannot connect');
                });
            }, function () {
                injector.log.error('found nothing');
            });
        }
    });
    btSerial.inquire();
}

function decode(data) {

    switch (data[1]) {
        case 35:
            // injector.log.info("Received LifeSign message");
            break;
        case 44:
            // injector.log.info("Received Event message");
            results.push(data[8]);
            break;
        case 43:
            injector.log.info("Received Summary Data Packet");
            break;
        case 37:
            injector.log.info("Received Accelerometer Data Packet");
            break;
        case 36:
            injector.log.info("Received R to R Data Packet");
            break;
        case 33:
            injector.log.info("Received Breathing Data Packet");
            break;
        default:
            injector.log.info("Packet type: " + data[1]);
            injector.log.info("Received Not recognised message");
            break;
    }
}

function listener(socket, callback) {

    socket.on('data', function (buffer) {
        decode(buffer);
        lifeSing = create_message_frame('100011', 0);
        socket.write(new Buffer(lifeSing), function (err, bytesWritten) {
            if (err) injector.log.error(err);
        });
    });
    setTimeout(function () {
        stop(socket, function (res) {
            callback(res);
        });
    }, 20000);
}

function checkBin(n) {
    return /^[01]{1,64}$/.test(n)
}

function Bin2Hex(n) {
    if (!checkBin(n))return 0;
    return parseInt(n, 2).toString(16)
}

function create_message_frame(message_id, payload) {
    dlc = payload.toString().length;
    if (0 <= dlc <= 128) {
        crc_byte = crc.crc32(payload);
        message_bytes = '00000010' + message_id + dlc + payload + crc_byte + '00000011';
        message_fame = Bin2Hex(message_bytes);
        return message_fame
    }
}

function stop(socket, callback) {
    is_stopping = true;
    socket.close();
    avg(function (res) {
        callback(res);
    });

}

function avg(callback) {
    var sum = 0;
    if (is_stopping == true) {
        for (var i = 0; i < results.length; i++) {
            sum = sum + results[i];
        }
        var media = sum / results.length;
        media = media.toFixed();
        callback(media);
    }
}