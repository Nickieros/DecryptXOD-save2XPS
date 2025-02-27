/* eslint-disable no-underscore-dangle,no-throw-literal,no-bitwise,no-useless-escape,no-mixed-operators,no-restricted-globals,max-len,no-plusplus,func-names,block-scoped-var,no-redeclare,no-var,vars-on-top,eqeqeq,no-shadow,prefer-destructuring,camelcase,no-cond-assign,no-undef,no-unused-expressions,prefer-rest-params,no-unused-vars,guard-for-in,no-self-compare,no-restricted-syntax,import/no-unresolved,global-require,no-prototype-builtins */
/*
 Advanced Encryption Standard (AES) Cipher-Block Chaining implementation.|This implementation is based on the public domain library 'jscrypto' which|was written by:|Emily Stark (estark@stanford.edu)|Mike Hamburg (mhamburg@stanford.edu)|Dan Boneh (dabo@cs.stanford.edu)|Parts of this code are based on the OpenSSL implementation of AES:|http://www.openssl.org|@author Dave Longley|Copyright (c) 2010-2012 Digital Bazaar, Inc. */
(function () {
    if (typeof window !== "undefined") {
        var forge = window.forge = window.forge || {};
        forge.aes = {};
    } else if (typeof module !== "undefined" && module.exports) {
        var forge = { util: require("./util") };
        module.exports = forge.aes = {};
    } else if (typeof self !== "undefined") {
        var forge = self.forge = self.forge || {};
        forge.aes = {};
    }
    let init = false;
    const Nb = 4;
    let sbox;
    let isbox;
    let rcon;
    let mix;
    let imix;
    const initialize = function () {
        init = true;
        rcon = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
        const xtime = new Array(256);
        for (var i = 0; i < 128; ++i) {
            xtime[i] = i << 1;
            xtime[i
            + 128] = i + 128 << 1 ^ 283;
        }
        sbox = new Array(256);
        isbox = new Array(256);
        mix = new Array(4);
        imix = new Array(4);
        for (var i = 0; i < 4; ++i) {
            mix[i] = new Array(256);
            imix[i] = new Array(256);
        }
        let e = 0; let ei = 0; let e2; let e4; let e8; let sx; let sx2; let me; let
            ime;
        for (var i = 0; i < 256; ++i) {
            sx = ei ^ ei << 1 ^ ei << 2 ^ ei << 3 ^ ei << 4;
            sx = sx >> 8 ^ sx & 255 ^ 99;
            sbox[e] = sx;
            isbox[sx] = e;
            sx2 = xtime[sx];
            e2 = xtime[e];
            e4 = xtime[e2];
            e8 = xtime[e4];
            me = sx2 << 24 ^ sx << 16 ^ sx << 8 ^ (sx ^ sx2);
            ime = (e2 ^ e4 ^ e8) << 24 ^ (e ^ e8) << 16 ^ (e ^ e4 ^ e8) << 8 ^ (e ^ e2 ^ e8);
            for (let n = 0; n < 4; ++n) {
                mix[n][e] = me;
                imix[n][sx] = ime;
                me = me << 24 | me >>> 8;
                ime = ime
                    << 24 | ime >>> 8;
            }
            if (e === 0) e = ei = 1; else {
                e = e2 ^ xtime[xtime[xtime[e2 ^ e8]]];
                ei ^= xtime[xtime[ei]];
            }
        }
    };
    const expandKey = function (key, decrypt) {
        let w = key.slice(0);
        let temp; let
            iNk = 1;
        const Nk = w.length;
        const Nr1 = Nk + 6 + 1;
        var end = Nb * Nr1;
        for (var i = Nk; i < end; ++i) {
            temp = w[i - 1];
            if (i % Nk === 0) {
                temp = sbox[temp >>> 16 & 255] << 24 ^ sbox[temp >>> 8 & 255] << 16 ^ sbox[temp & 255] << 8 ^ sbox[temp >>> 24] ^ rcon[iNk] << 24;
                iNk++;
            } else if (Nk > 6 && i % Nk == 4) temp = sbox[temp >>> 24] << 24 ^ sbox[temp >>> 16 & 255] << 16 ^ sbox[temp >>> 8 & 255] << 8 ^ sbox[temp & 255];
            w[i] = w[i - Nk] ^ temp;
        }
        if (decrypt) {
            let tmp;
            const m0 = imix[0];
            const m1 = imix[1];
            const m2 = imix[2];
            const m3 = imix[3];
            const wnew = w.slice(0);
            var end = w.length;
            for (var i = 0, wi = end - Nb; i < end; i += Nb, wi -= Nb) {
                if (i === 0 || i === end - Nb) {
                    wnew[i] = w[wi];
                    wnew[i + 1] = w[wi + 3];
                    wnew[i + 2] = w[wi + 2];
                    wnew[i + 3] = w[wi + 1];
                } else {
                    for (let n = 0; n < Nb; ++n) {
                        tmp = w[wi + n];
                        wnew[i + (3 & -n)] = m0[sbox[tmp >>> 24]] ^ m1[sbox[tmp >>> 16 & 255]] ^ m2[sbox[tmp >>> 8 & 255]] ^ m3[sbox[tmp & 255]];
                    }
                }
            }
            w = wnew;
        }
        return w;
    };
    const _updateBlock = function (w, input, output, decrypt) {
        const Nr = w.length / 4 - 1;
        let m0; let m1; let m2; let m3; let
            sub;
        if (decrypt) {
            m0 = imix[0];
            m1 = imix[1];
            m2 = imix[2];
            m3 = imix[3];
            sub = isbox;
        } else {
            m0 = mix[0];
            m1 = mix[1];
            m2 = mix[2];
            m3 = mix[3];
            sub = sbox;
        }
        let a; let b; let c; let d; let a2; let b2; let
            c2;
        a = input[0] ^ w[0];
        b = input[decrypt ? 3 : 1] ^ w[1];
        c = input[2] ^ w[2];
        d = input[decrypt ? 1 : 3] ^ w[3];
        let i = 3;
        for (let round = 1; round < Nr; ++round) {
            a2 = m0[a >>> 24] ^ m1[b >>> 16 & 255] ^ m2[c >>> 8 & 255] ^ m3[d & 255] ^ w[++i];
            b2 = m0[b >>> 24] ^ m1[c >>> 16 & 255] ^ m2[d >>> 8 & 255] ^ m3[a & 255] ^ w[++i];
            c2 = m0[c >>> 24] ^ m1[d >>> 16 & 255] ^ m2[a >>> 8 & 255] ^ m3[b & 255] ^ w[++i];
            d = m0[d >>> 24] ^ m1[a >>> 16 & 255] ^ m2[b >>> 8 & 255] ^ m3[c & 255] ^ w[++i];
            a = a2;
            b = b2;
            c = c2;
        }
        output[0] = sub[a
        >>> 24] << 24 ^ sub[b >>> 16 & 255] << 16 ^ sub[c >>> 8 & 255] << 8 ^ sub[d & 255] ^ w[++i];
        output[decrypt ? 3 : 1] = sub[b >>> 24] << 24 ^ sub[c >>> 16 & 255] << 16 ^ sub[d >>> 8 & 255] << 8 ^ sub[a & 255] ^ w[++i];
        output[2] = sub[c >>> 24] << 24 ^ sub[d >>> 16 & 255] << 16 ^ sub[a >>> 8 & 255] << 8 ^ sub[b & 255] ^ w[++i];
        output[decrypt ? 1 : 3] = sub[d >>> 24] << 24 ^ sub[a >>> 16 & 255] << 16 ^ sub[b >>> 8 & 255] << 8 ^ sub[c & 255] ^ w[++i];
    };
    const _createCipher = function (key, iv, output, decrypt) {
        let cipher = null;
        if (!init) initialize();
        if (key.constructor == String && (key.length == 16 || key.length == 24 || key.length == 32)) key = forge.util.createBuffer(key);
        else if (key.constructor == Array && (key.length == 16 || key.length == 24 || key.length == 32)) {
            var tmp = key;
            var key = forge.util.createBuffer();
            for (var i = 0; i < tmp.length; ++i) key.putByte(tmp[i]);
        }
        if (key.constructor != Array) {
            var tmp = key;
            key = [];
            let len = tmp.length();
            if (len == 16 || len == 24 || len == 32) {
                len >>>= 2;
                for (var i = 0; i < len; ++i) key.push(tmp.getInt32());
            }
        }
        if (key.constructor == Array && (key.length == 4 || key.length == 6 || key.length == 8)) {
            const _w = expandKey(key, decrypt);
            const _blockSize = Nb << 2;
            let _input;
            let _output;
            let _inBlock;
            let _outBlock;
            let _prev;
            let _finish;
            cipher = { output: null };
            cipher.update = function (input) {
                if (!_finish) _input.putBuffer(input);
                const threshold = decrypt && !_finish ? _blockSize << 1 : _blockSize;
                while (_input.length() >= threshold) {
                    if (decrypt) for (var i = 0; i < Nb; ++i) _inBlock[i] = _input.getInt32(); else for (var i = 0; i < Nb; ++i) _inBlock[i] = _prev[i] ^ _input.getInt32();
                    _updateBlock(_w, _inBlock, _outBlock, decrypt);
                    if (decrypt) {
                        for (var i = 0; i < Nb; ++i) _output.putInt32(_prev[i] ^ _outBlock[i]);
                        _prev = _inBlock.slice(0);
                    } else {
                        for (var i = 0; i < Nb; ++i) _output.putInt32(_outBlock[i]);
                        _prev = _outBlock;
                    }
                }
            };
            cipher.finish = function (pad) {
                let rval = true;
                if (!decrypt) {
                    if (pad) rval = pad(_blockSize, _input, decrypt); else {
                        const padding = _input.length() == _blockSize ? _blockSize : _blockSize - _input.length();
                        _input.fillWithByte(padding, padding);
                    }
                }
                if (rval) {
                    _finish = true;
                    cipher.update();
                }
                if (decrypt) {
                    rval = _input.length() === 0;
                    if (rval) {
                        if (pad) rval = pad(_blockSize, _output, decrypt); else {
                            const len = _output.length();
                            const count = _output.at(len - 1);
                            if (count > Nb << 2) rval = false; else _output.truncate(count);
                        }
                    }
                }
                return rval;
            };
            cipher.start = function (iv, output) {
                iv = iv || _prev.slice(0);
                if (iv.constructor == String && iv.length == 16) iv = forge.util.createBuffer(iv); else if (iv.constructor == Array && iv.length == 16) {
                    var tmp = iv;
                    var iv = forge.util.createBuffer();
                    for (let i = 0; i < 16; ++i) iv.putByte(tmp[i]);
                }
                if (iv.constructor != Array) {
                    var tmp = iv;
                    iv = new Array(4);
                    iv[0] = tmp.getInt32();
                    iv[1] = tmp.getInt32();
                    iv[2] = tmp.getInt32();
                    iv[3] = tmp.getInt32();
                }
                _input = forge.util.createBuffer();
                _output = output || forge.util.createBuffer();
                _prev = iv.slice(0);
                _inBlock = new Array(Nb);
                _outBlock = new Array(Nb);
                _finish = false;
                cipher.output = _output;
            };
            if (iv !== null) cipher.start(iv, output);
        }
        return cipher;
    };
    forge.aes.startEncrypting = function (key, iv, output) {
        return _createCipher(key, iv, output, false);
    };
    forge.aes.createEncryptionCipher = function (key) {
        return _createCipher(key, null, null, false);
    };
    forge.aes.startDecrypting = function (key, iv, output) {
        return _createCipher(key, iv, output, true);
    };
    forge.aes.createDecryptionCipher = function (key) {
        return _createCipher(key, null, null, true);
    };
    forge.aes._expandKey = function (key,
        decrypt) {
        if (!init) initialize();
        return expandKey(key, decrypt);
    };
    forge.aes._updateBlock = _updateBlock;
}());
(function () {
    if (typeof window !== "undefined") {
        var forge = window.forge = window.forge || {};
        forge.util = {};
    } else if (typeof module !== "undefined" && module.exports) {
        var forge = {};
        module.exports = forge.util = {};
    } else if (typeof self !== "undefined") {
        var forge = self.forge = self.forge || {};
        forge.util = {};
    }
    const { util } = forge;
    util.ByteBuffer = function (b) {
        this.data = b || "";
        this.read = 0;
    };
    util.ByteBuffer.prototype.length = function () {
        return this.data.length - this.read;
    };
    util.ByteBuffer.prototype.isEmpty = function () {
        return this.data.length
            - this.read === 0;
    };
    util.ByteBuffer.prototype.putByte = function (b) {
        this.data += String.fromCharCode(b);
    };
    util.ByteBuffer.prototype.fillWithByte = function (b, n) {
        b = String.fromCharCode(b);
        let d = this.data;
        while (n > 0) {
            if (n & 1) d += b;
            n >>>= 1;
            if (n > 0) b += b;
        }
        this.data = d;
    };
    util.ByteBuffer.prototype.putBytes = function (bytes) {
        this.data += bytes;
    };
    util.ByteBuffer.prototype.putString = function (str) {
        this.data += util.encodeUtf8(str);
    };
    util.ByteBuffer.prototype.putInt16 = function (i) {
        this.data += String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i
            & 255);
    };
    util.ByteBuffer.prototype.putInt24 = function (i) {
        this.data += String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
    };
    util.ByteBuffer.prototype.putInt32 = function (i) {
        this.data += String.fromCharCode(i >> 24 & 255) + String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
    };
    util.ByteBuffer.prototype.putInt16Le = function (i) {
        this.data += String.fromCharCode(i & 255) + String.fromCharCode(i >> 8 & 255);
    };
    util.ByteBuffer.prototype.putInt24Le = function (i) {
        this.data
            += String.fromCharCode(i & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i >> 16 & 255);
    };
    util.ByteBuffer.prototype.putInt32Le = function (i) {
        this.data += String.fromCharCode(i & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 24 & 255);
    };
    util.ByteBuffer.prototype.putInt = function (i, n) {
        do {
            n -= 8;
            this.data += String.fromCharCode(i >> n & 255);
        } while (n > 0);
    };
    util.ByteBuffer.prototype.putBuffer = function (buffer) {
        this.data += buffer.getBytes();
    };
    util.ByteBuffer.prototype.getByte = function () {
        return this.data.charCodeAt(this.read++);
    };
    util.ByteBuffer.prototype.getInt16 = function () {
        const rval = this.data.charCodeAt(this.read) << 8 ^ this.data.charCodeAt(this.read + 1);
        this.read += 2;
        return rval;
    };
    util.ByteBuffer.prototype.getInt24 = function () {
        const rval = this.data.charCodeAt(this.read) << 16 ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2);
        this.read += 3;
        return rval;
    };
    util.ByteBuffer.prototype.getInt32 = function () {
        const rval = this.data.charCodeAt(this.read) << 24 ^ this.data.charCodeAt(this.read + 1) << 16 ^ this.data.charCodeAt(this.read + 2)
            << 8 ^ this.data.charCodeAt(this.read + 3);
        this.read += 4;
        return rval;
    };
    util.ByteBuffer.prototype.getInt16Le = function () {
        const rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8;
        this.read += 2;
        return rval;
    };
    util.ByteBuffer.prototype.getInt24Le = function () {
        const rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16;
        this.read += 3;
        return rval;
    };
    util.ByteBuffer.prototype.getInt32Le = function () {
        const rval = this.data.charCodeAt(this.read) ^ this.data.charCodeAt(this.read
            + 1) << 8 ^ this.data.charCodeAt(this.read + 2) << 16 ^ this.data.charCodeAt(this.read + 3) << 24;
        this.read += 4;
        return rval;
    };
    util.ByteBuffer.prototype.getInt = function (n) {
        let rval = 0;
        do {
            rval = (rval << n) + this.data.charCodeAt(this.read++);
            n -= 8;
        } while (n > 0);
        return rval;
    };
    util.ByteBuffer.prototype.getBytes = function (count) {
        let rval;
        if (count) {
            count = Math.min(this.length(), count);
            rval = this.data.slice(this.read, this.read + count);
            this.read += count;
        } else if (count === 0) rval = ""; else {
            rval = this.read === 0 ? this.data : this.data.slice(this.read);
            this.clear();
        }
        return rval;
    };
    util.ByteBuffer.prototype.bytes = function (count) {
        return typeof count === "undefined" ? this.data.slice(this.read) : this.data.slice(this.read, this.read + count);
    };
    util.ByteBuffer.prototype.at = function (i) {
        return this.data.charCodeAt(this.read + i);
    };
    util.ByteBuffer.prototype.setAt = function (i, b) {
        this.data = this.data.substr(0, this.read + i) + String.fromCharCode(b) + this.data.substr(this.read + i + 1);
    };
    util.ByteBuffer.prototype.last = function () {
        return this.data.charCodeAt(this.data.length - 1);
    };
    util.ByteBuffer.prototype.copy = function () {
        const c = util.createBuffer(this.data);
        c.read = this.read;
        return c;
    };
    util.ByteBuffer.prototype.compact = function () {
        if (this.read > 0) {
            this.data = this.data.slice(this.read);
            this.read = 0;
        }
    };
    util.ByteBuffer.prototype.clear = function () {
        this.data = "";
        this.read = 0;
    };
    util.ByteBuffer.prototype.truncate = function (count) {
        const len = Math.max(0, this.length() - count);
        this.data = this.data.substr(this.read, len);
        this.read = 0;
    };
    util.ByteBuffer.prototype.toHex = function () {
        let rval = "";
        for (let i = this.read; i < this.data.length; ++i) {
            const b =                this.data.charCodeAt(i);
            if (b < 16) rval += "0";
            rval += b.toString(16);
        }
        return rval;
    };
    util.ByteBuffer.prototype.toString = function () {
        return util.decodeUtf8(this.bytes());
    };
    util.createBuffer = function (input, encoding) {
        encoding = encoding || "raw";
        if (input !== undefined && encoding === "utf8") input = util.encodeUtf8(input);
        return new util.ByteBuffer(input);
    };
    util.fillString = function (c, n) {
        let s = "";
        while (n > 0) {
            if (n & 1) s += c;
            n >>>= 1;
            if (n > 0) c += c;
        }
        return s;
    };
    util.xorBytes = function (s1, s2, n) {
        let s3 = "";
        let b = "";
        let t = "";
        let i = 0;
        let c = 0;
        for (; n
               > 0; --n, ++i) {
            b = s1.charCodeAt(i) ^ s2.charCodeAt(i);
            if (c >= 10) {
                s3 += t;
                t = "";
                c = 0;
            }
            t += String.fromCharCode(b);
            ++c;
        }
        s3 += t;
        return s3;
    };
    util.hexToBytes = function (hex) {
        let rval = "";
        let i = 0;
        if (hex.length & 1 === 1) {
            i = 1;
            rval += String.fromCharCode(parseInt(hex[0], 16));
        }
        for (; i < hex.length; i += 2) rval += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return rval;
    };
    util.bytesToHex = function (bytes) {
        return util.createBuffer(bytes).toHex();
    };
    util.int32ToBytes = function (i) {
        return String.fromCharCode(i >> 24 & 255) + String.fromCharCode(i >> 16 & 255)
            + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255);
    };
    const _base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    const _base64Idx = [62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 64, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
    util.encode64 = function (input, maxline) {
        let line = "";
        let output = "";
        let chr1; let chr2; let
            chr3;
        let i = 0;
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            line += _base64.charAt(chr1 >> 2);
            line += _base64.charAt((chr1 & 3) << 4 | chr2 >> 4);
            if (isNaN(chr2)) line += "=="; else {
                line += _base64.charAt((chr2 & 15) << 2 | chr3 >> 6);
                line += isNaN(chr3) ? "=" : _base64.charAt(chr3 & 63);
            }
            if (maxline && line.length > maxline) {
                output += `${line.substr(0, maxline)}\r\n`;
                line = line.substr(maxline);
            }
        }
        output += line;
        return output;
    };
    util.decode64 = function (input) {
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        let output = "";
        let enc1; let enc2; let enc3;
        let enc4;
        let i = 0;
        while (i < input.length) {
            enc1 = _base64Idx[input.charCodeAt(i++) - 43];
            enc2 = _base64Idx[input.charCodeAt(i++) - 43];
            enc3 = _base64Idx[input.charCodeAt(i++) - 43];
            enc4 = _base64Idx[input.charCodeAt(i++) - 43];
            output += String.fromCharCode(enc1 << 2 | enc2 >> 4);
            if (enc3 !== 64) {
                output += String.fromCharCode((enc2 & 15) << 4 | enc3 >> 2);
                if (enc4 !== 64) output += String.fromCharCode((enc3 & 3) << 6 | enc4);
            }
        }
        return output;
    };
    util.encodeUtf8 = function (str) {
        return unescape(encodeURIComponent(str));
    };
    util.decodeUtf8 = function (str) {
        return decodeURIComponent(escape(str));
    };
    util.deflate = function (api, bytes, raw) {
        bytes = util.decode64(api.deflate(util.encode64(bytes)).rval);
        if (raw) {
            let start = 2;
            const flg = bytes.charCodeAt(1);
            if (flg & 32) start = 6;
            bytes = bytes.substring(start, bytes.length - 4);
        }
        return bytes;
    };
    util.inflate = function (api, bytes, raw) {
        const { rval } = api.inflate(util.encode64(bytes));
        return rval === null ? null : util.decode64(rval);
    };
    const _setStorageObject = function (api, id, obj) {
        if (!api) throw { message: "WebStorage not available." };
        let rval;
        if (obj === null) rval = api.removeItem(id); else {
            obj = util.encode64(JSON.stringify(obj));
            rval = api.setItem(id, obj);
        }
        if (typeof rval !== "undefined" && rval.rval !== true) throw rval.error;
    };
    const _getStorageObject = function (api, id) {
        if (!api) throw { message: "WebStorage not available." };
        let rval = api.getItem(id);
        if (api.init) {
            if (rval.rval === null) {
                if (rval.error) throw rval.error;
                rval = null;
            } else rval = rval.rval;
        }
        if (rval !== null) rval = JSON.parse(util.decode64(rval));
        return rval;
    };
    const _setItem = function (api, id, key, data) {
        let obj = _getStorageObject(api, id);
        if (obj === null) obj = {};
        obj[key] = data;
        _setStorageObject(api, id, obj);
    };
    const _getItem = function (api, id, key) {
        let rval = _getStorageObject(api, id);
        if (rval !== null) rval = key in rval ? rval[key] : null;
        return rval;
    };
    const _removeItem = function (api, id, key) {
        let obj = _getStorageObject(api, id);
        if (obj !== null && key in obj) {
            delete obj[key];
            let empty = true;
            for (const prop in tmp) {
                empty = false;
                break;
            }
            if (empty) obj = null;
            _setStorageObject(api, id, obj);
        }
    };
    const _clearItems = function (api, id) {
        _setStorageObject(api, id, null);
    };
    const _callStorageFunction = function (func, args, location) {
        let rval =            null;
        if (typeof location === "undefined") location = ["web", "flash"];
        let type;
        let done = false;
        let exception = null;
        for (const idx in location) {
            type = location[idx];
            try {
                if (type === "flash" || type === "both") {
                    if (args[0] === null) throw { message: "Flash local storage not available." }; else {
                        rval = func.apply(this, args);
                        done = type === "flash";
                    }
                }
                if (type === "web" || type === "both") {
                    args[0] = localStorage;
                    rval = func.apply(this, args);
                    done = true;
                }
            } catch (ex) {
                exception = ex;
            }
            if (done) break;
        }
        if (!done) throw exception;
        return rval;
    };
    util.setItem = function (api,
        id, key, data, location) {
        _callStorageFunction(_setItem, arguments, location);
    };
    util.getItem = function (api, id, key, location) {
        return _callStorageFunction(_getItem, arguments, location);
    };
    util.removeItem = function (api, id, key, location) {
        _callStorageFunction(_removeItem, arguments, location);
    };
    util.clearItems = function (api, id, location) {
        _callStorageFunction(_clearItems, arguments, location);
    };
    util.parseUrl = function (str) {
        const regex = /^(https?):\/\/([^:&^\/]*):?(\d*)(.*)$/g;
        regex.lastIndex = 0;
        const m = regex.exec(str);
        const url = m
        === null ? null : {
                full: str, scheme: m[1], host: m[2], port: m[3], path: m[4],
            };
        if (url) {
            url.fullHost = url.host;
            if (url.port) { if (url.port !== 80 && url.scheme === "http") url.fullHost += `:${url.port}`; else if (url.port !== 443 && url.scheme === "https") url.fullHost += `:${url.port}`; } else if (url.scheme === "http") url.port = 80; else if (url.scheme === "https") url.port = 443;
            url.full = `${url.scheme}://${url.fullHost}`;
        }
        return url;
    };
    let _queryVariables = null;
    util.getQueryVariables = function (query) {
        const parse = function (q) {
            const rval = {};
            const kvpairs = q.split("&");
            for (let i =                0; i < kvpairs.length; i++) {
                const pos = kvpairs[i].indexOf("=");
                var key;
                var val;
                if (pos > 0) {
                    key = kvpairs[i].substring(0, pos);
                    val = kvpairs[i].substring(pos + 1);
                } else {
                    key = kvpairs[i];
                    val = null;
                }
                if (!(key in rval)) rval[key] = [];
                if (val !== null) rval[key].push(unescape(val));
            }
            return rval;
        };
        let rval;
        if (typeof query === "undefined") {
            if (_queryVariables === null) if (typeof window === "undefined") _queryVariables = {}; else _queryVariables = parse(window.location.search.substring(1));
            rval = _queryVariables;
        } else rval = parse(query);
        return rval;
    };
    util.parseFragment = function (fragment) {
        let fp = fragment;
        let fq = "";
        const pos = fragment.indexOf("?");
        if (pos > 0) {
            fp = fragment.substring(0, pos);
            fq = fragment.substring(pos + 1);
        }
        const path = fp.split("/");
        if (path.length > 0 && path[0] == "") path.shift();
        const query = fq == "" ? {} : util.getQueryVariables(fq);
        return {
            pathString: fp, queryString: fq, path, query,
        };
    };
    util.makeRequest = function (reqString) {
        const frag = util.parseFragment(reqString);
        var req = {
            path: frag.pathString,
            query: frag.queryString,
            getPath(i) {
                return typeof i === "undefined" ? frag.path
                    : frag.path[i];
            },
            getQuery(k, i) {
                let rval;
                if (typeof k === "undefined") rval = frag.query; else {
                    rval = frag.query[k];
                    if (rval && typeof i !== "undefined") rval = rval[i];
                }
                return rval;
            },
            getQueryLast(k, _default) {
                let rval;
                const vals = req.getQuery(k);
                if (vals) rval = vals[vals.length - 1]; else rval = _default;
                return rval;
            },
        };
        return req;
    };
    util.makeLink = function (path, query, fragment) {
        path = jQuery.isArray(path) ? path.join("/") : path;
        const qstr = jQuery.param(query || {});
        fragment = fragment || "";
        return path + (qstr.length > 0 ? `?${qstr}` : "")
            + (fragment.length > 0 ? `#${fragment}` : "");
    };
    util.setPath = function (object, keys, value) {
        if (typeof object === "object" && object !== null) {
            let i = 0;
            const len = keys.length;
            while (i < len) {
                const next = keys[i++];
                if (i == len) object[next] = value; else {
                    const hasNext = next in object;
                    if (!hasNext || hasNext && typeof object[next] !== "object" || hasNext && object[next] === null) object[next] = {};
                    object = object[next];
                }
            }
        }
    };
    util.getPath = function (object, keys, _default) {
        let i = 0;
        const len = keys.length;
        let hasNext = true;
        while (hasNext && i < len && typeof object === "object"
        && object !== null) {
            const next = keys[i++];
            hasNext = next in object;
            if (hasNext) object = object[next];
        }
        return hasNext ? object : _default;
    };
    util.deletePath = function (object, keys) {
        if (typeof object === "object" && object !== null) {
            let i = 0;
            const len = keys.length;
            while (i < len) {
                const next = keys[i++];
                if (i == len) delete object[next]; else {
                    if (!(next in object) || typeof object[next] !== "object" || object[next] === null) break;
                    object = object[next];
                }
            }
        }
    };
    util.isEmpty = function (obj) {
        for (const prop in obj) if (obj.hasOwnProperty(prop)) return false;
        return true;
    };
    util.format = function (format) {
        const re = /%./g;
        let match;
        let part;
        let argi = 0;
        const parts = [];
        let last = 0;
        while (match = re.exec(format)) {
            part = format.substring(last, re.lastIndex - 2);
            if (part.length > 0) parts.push(part);
            last = re.lastIndex;
            const code = match[0][1];
            switch (code) {
                case "s":
                case "o":
                    if (argi < arguments.length) parts.push(arguments[argi++ + 1]); else parts.push("<?>");
                    break;
                case "%":
                    parts.push("%");
                    break;
                default:
                    parts.push(`<%${code}?>`);
            }
        }
        parts.push(format.substring(last));
        return parts.join("");
    };
    util.formatNumber = function (number, decimals, dec_point, thousands_sep) {
        let n = number; const
            c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals;
        const d = dec_point === undefined ? "," : dec_point;
        const t = thousands_sep === undefined ? "." : thousands_sep; const
            s = n < 0 ? "-" : "";
        const i = `${parseInt(n = Math.abs(+n || 0).toFixed(c), 10)}`;
        const j = i.length > 3 ? i.length % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${t}`) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    };
    util.formatSize = function (size) {
        if (size >= 1073741824) {
            size = `${util.formatNumber(size / 1073741824,
                2, ".", "")} GiB`;
        } else if (size >= 1048576) size = `${util.formatNumber(size / 1048576, 2, ".", "")} MiB`; else if (size >= 1024) size = `${util.formatNumber(size / 1024, 0)} KiB`; else size = `${util.formatNumber(size, 0)} bytes`;
        return size;
    };
}());
self.onmessage = function (a) {
    const f = a.data.data; const e = a.data.password; const
        d = a.data.partName;
    switch (a.data.type) {
        case "AES":
            a = self.a(f, e, d);
            break;
        default:
            a = self.a(f, e, d);
    }
    self.postMessage(a);
};
(function (a) {
    a.a = function (a, e, d) {
        for (var c = [], b = 0; b < 16; ++b) {
            c[b] = b;
            b < e.length && (c[b] |= e.charCodeAt(b));
            const g = d.length + b - 16;
            g >= 0 && (c[b] |= d.charCodeAt(g));
        }
        e = [];
        for (d = 0; d < 16; ++d) e.push(a.charCodeAt(d));
        a = a.slice(16);
        c = forge.aes.startDecrypting(c, e);
        c.update(forge.util.createBuffer(a));
        return c.finish() ? c.output.data : { error: "Bad password or file corrupt" };
    };
}(self));
