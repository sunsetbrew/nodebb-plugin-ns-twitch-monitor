/**
 * Created by Nicolas on 6/27/15.
 */
(function (StreamList) {
    'use strict';

    var _            = require('lodash'),
        EventEmitter = require('eventemitter3'),
        util         = require('util'),

        logger       = require('../logger');

    function List(channels) {
        EventEmitter.call(this);
        this.channels = channels;
        this.channelsMap = {};
        this.streamsMap = {};

        channels.forEach(function (channel) {
            this.channelsMap[channel.name] = channel;
        }, this);
    }

    util.inherits(List, EventEmitter);

    List.prototype.addStream = function (channel, stream) {
        this.streamsMap[channel.name] = this.cleanStreamPayload(stream);
    };

    List.prototype.cleanStreamPayload = function (streamData) {
        return _.omit(streamData, ['_links', 'channel']);
    };

    List.prototype.deleteStream = function (channel) {
        delete this.streamsMap[channel.name];
    };

    List.prototype.mergeStream = function (channel, stream) {
        this.streamsMap[channel.name] = this.cleanStreamPayload(stream);
    };

    List.prototype.update = function (streams) {
        var streamsMap = {};
        streams.forEach(function (stream) {
            streamsMap[stream.channel.name] = stream;
        }, this);

        this.channels.forEach(function (channel, index) {
            this.updateStream(channel, streamsMap[channel.name], index);
        }, this);
    };

    List.prototype.updateStream = function (channel, streamData, index) {
        var previousState = this.streamsMap[channel.name];
        var newState = streamData;

        if (!previousState && newState) {
            //Go Online
            this.addStream(channel, newState);
            logger.log('verbose', 'Channel %s goes online', channel.name);
        } else if (previousState && !newState) {
            //Go Offline
            this.deleteStream(channel);
            logger.log('verbose', 'Channel %s goes offline', channel.name);
        } else if (previousState && newState) {
            //Update: live viewers, etc.
            this.mergeStream(channel, newState);
            logger.log('verbose', 'Channel %s is updated', channel.name);
        } else {
            //Channel is offline still
        }
    };

    StreamList.init = function (channels) {
        return new List(channels);
    };

})(module.exports);