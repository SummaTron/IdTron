// Empty JS for your own code to be here
var add_pre_fix_test = 'a0';   //a0 + address
var add_pre_fix_main = '41';   //41 + address

var pre_fix_test = 0xa0;   //a0 + address
var pre_fix_main = 0x41;   //41 + address
//--------core start----------//
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/**
 * CryptoJS core components.
 */
var CryptoJS = CryptoJS || (function (Math, undefined) {
  /**
   * CryptoJS namespace.
   */
  var C = {};

  /**
   * Library namespace.
   */
  var C_lib = C.lib = {};

  /**
   * Base object for prototypal inheritance.
   */
  var Base = C_lib.Base = (function () {
    function F() {
    }

    return {
      /**
       * Creates a new object that inherits from this object.
       *
       * @param {Object} overrides Properties to copy into the new object.
       *
       * @return {Object} The new object.
       *
       * @static
       *
       * @example
       *
       *     var MyType = CryptoJS.lib.Base.extend({
                 *         field: 'value',
                 *
                 *         method: function () {
                 *         }
                 *     });
       */
      extend: function (overrides) {
        // Spawn
        F.prototype = this;
        var subtype = new F();

        // Augment
        if (overrides) {
          subtype.mixIn(overrides);
        }

        // Create default initializer
        if (!subtype.hasOwnProperty('init')) {
          subtype.init = function () {
            subtype.$super.init.apply(this, arguments);
          };
        }

        // Initializer's prototype is the subtype object
        subtype.init.prototype = subtype;

        // Reference supertype
        subtype.$super = this;

        return subtype;
      },

      /**
       * Extends this object and runs the init method.
       * Arguments to create() will be passed to init().
       *
       * @return {Object} The new object.
       *
       * @static
       *
       * @example
       *
       *     var instance = MyType.create();
       */
      create: function () {
        var instance = this.extend();
        instance.init.apply(instance, arguments);

        return instance;
      },

      /**
       * Initializes a newly created object.
       * Override this method to add some logic when your objects are created.
       *
       * @example
       *
       *     var MyType = CryptoJS.lib.Base.extend({
                 *         init: function () {
                 *             // ...
                 *         }
                 *     });
       */
      init: function () {
      },

      /**
       * Copies properties into this object.
       *
       * @param {Object} properties The properties to mix in.
       *
       * @example
       *
       *     MyType.mixIn({
                 *         field: 'value'
                 *     });
       */
      mixIn: function (properties) {
        for (var propertyName in properties) {
          if (properties.hasOwnProperty(propertyName)) {
            this[propertyName] = properties[propertyName];
          }
        }

        // IE won't copy toString using the loop above
        if (properties.hasOwnProperty('toString')) {
          this.toString = properties.toString;
        }
      },

      /**
       * Creates a copy of this object.
       *
       * @return {Object} The clone.
       *
       * @example
       *
       *     var clone = instance.clone();
       */
      clone: function () {
        return this.init.prototype.extend(this);
      }
    };
  }());

  /**
   * An array of 32-bit words.
   *
   * @property {Array} words The array of 32-bit words.
   * @property {number} sigBytes The number of significant bytes in this word array.
   */
  var WordArray = C_lib.WordArray = Base.extend({
    /**
     * Initializes a newly created word array.
     *
     * @param {Array} words (Optional) An array of 32-bit words.
     * @param {number} sigBytes (Optional) The number of significant bytes in the words.
     *
     * @example
     *
     *     var wordArray = CryptoJS.lib.WordArray.create();
     *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
     *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
     */
    init: function (words, sigBytes) {
      words = this.words = words || [];

      if (sigBytes != undefined) {
        this.sigBytes = sigBytes;
      } else {
        this.sigBytes = words.length * 4;
      }
    },

    /**
     * Converts this word array to a string.
     *
     * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
     *
     * @return {string} The stringified word array.
     *
     * @example
     *
     *     var string = wordArray + '';
     *     var string = wordArray.toString();
     *     var string = wordArray.toString(CryptoJS.enc.Utf8);
     */
    toString: function (encoder) {
      return (encoder || Hex).stringify(this);
    },

    /**
     * Concatenates a word array to this word array.
     *
     * @param {WordArray} wordArray The word array to append.
     *
     * @return {WordArray} This word array.
     *
     * @example
     *
     *     wordArray1.concat(wordArray2);
     */
    concat: function (wordArray) {
      // Shortcuts
      var thisWords = this.words;
      var thatWords = wordArray.words;
      var thisSigBytes = this.sigBytes;
      var thatSigBytes = wordArray.sigBytes;

      // Clamp excess bits
      this.clamp();

      // Concat
      if (thisSigBytes % 4) {
        // Copy one byte at a time
        for (var i = 0; i < thatSigBytes; i++) {
          var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
          thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24
              - ((thisSigBytes + i) % 4) * 8);
        }
      } else if (thatWords.length > 0xffff) {
        // Copy one word at a time
        for (var i = 0; i < thatSigBytes; i += 4) {
          thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
        }
      } else {
        // Copy all words at once
        thisWords.push.apply(thisWords, thatWords);
      }
      this.sigBytes += thatSigBytes;

      // Chainable
      return this;
    },

    /**
     * Removes insignificant bits.
     *
     * @example
     *
     *     wordArray.clamp();
     */
    clamp: function () {
      // Shortcuts
      var words = this.words;
      var sigBytes = this.sigBytes;

      // Clamp
      words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
      words.length = Math.ceil(sigBytes / 4);
    },

    /**
     * Creates a copy of this word array.
     *
     * @return {WordArray} The clone.
     *
     * @example
     *
     *     var clone = wordArray.clone();
     */
    clone: function () {
      var clone = Base.clone.call(this);
      clone.words = this.words.slice(0);

      return clone;
    },

    /**
     * Creates a word array filled with random bytes.
     *
     * @param {number} nBytes The number of random bytes to generate.
     *
     * @return {WordArray} The random word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.lib.WordArray.random(16);
     */
    random: function (nBytes) {
      var words = [];
      for (var i = 0; i < nBytes; i += 4) {
        words.push((Math.random() * 0x100000000) | 0);
      }

      return new WordArray.init(words, nBytes);
    }
  });

  /**
   * Encoder namespace.
   */
  var C_enc = C.enc = {};

  /**
   * Hex encoding strategy.
   */
  var Hex = C_enc.Hex = {
    /**
     * Converts a word array to a hex string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The hex string.
     *
     * @static
     *
     * @example
     *
     *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
     */
    stringify: function (wordArray) {
      // Shortcuts
      var words = wordArray.words;
      var sigBytes = wordArray.sigBytes;

      // Convert
      var hexChars = [];
      for (var i = 0; i < sigBytes; i++) {
        var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        hexChars.push((bite >>> 4).toString(16));
        hexChars.push((bite & 0x0f).toString(16));
      }

      return hexChars.join('');
    },

    /**
     * Converts a hex string to a word array.
     *
     * @param {string} hexStr The hex string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
     */
    parse: function (hexStr) {
      // Shortcut
      var hexStrLength = hexStr.length;

      // Convert
      var words = [];
      for (var i = 0; i < hexStrLength; i += 2) {
        words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8)
            * 4);
      }

      return new WordArray.init(words, hexStrLength / 2);
    }
  };

  /**
   * Latin1 encoding strategy.
   */
  var Latin1 = C_enc.Latin1 = {
    /**
     * Converts a word array to a Latin1 string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The Latin1 string.
     *
     * @static
     *
     * @example
     *
     *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
     */
    stringify: function (wordArray) {
      // Shortcuts
      var words = wordArray.words;
      var sigBytes = wordArray.sigBytes;

      // Convert
      var latin1Chars = [];
      for (var i = 0; i < sigBytes; i++) {
        var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        latin1Chars.push(String.fromCharCode(bite));
      }

      return latin1Chars.join('');
    },

    /**
     * Converts a Latin1 string to a word array.
     *
     * @param {string} latin1Str The Latin1 string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
     */
    parse: function (latin1Str) {
      // Shortcut
      var latin1StrLength = latin1Str.length;

      // Convert
      var words = [];
      for (var i = 0; i < latin1StrLength; i++) {
        words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4)
            * 8);
      }

      return new WordArray.init(words, latin1StrLength);
    },

    /**
     * Converts a bytes to a word array.
     *
     * @param {string} bytes The byte array.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
     */
    bytes2words: function (bytes) {
      // Shortcut
      var latin1StrLength = bytes.length;

      // Convert
      var words = [];
      for (var i = 0; i < latin1StrLength; i++) {
        words[i >>> 2] |= (bytes[i] & 0xff) << (24 - (i % 4)
            * 8);
      }

      return new WordArray.init(words, latin1StrLength);
    }
  };

  /**
   * UTF-8 encoding strategy.
   */
  var Utf8 = C_enc.Utf8 = {
    /**
     * Converts a word array to a UTF-8 string.
     *
     * @param {WordArray} wordArray The word array.
     *
     * @return {string} The UTF-8 string.
     *
     * @static
     *
     * @example
     *
     *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
     */
    stringify: function (wordArray) {
      try {
        return decodeURIComponent(escape(Latin1.stringify(wordArray)));
      } catch (e) {
        throw new Error('Malformed UTF-8 data');
      }
    },

    /**
     * Converts a UTF-8 string to a word array.
     *
     * @param {string} utf8Str The UTF-8 string.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
     */
    parse: function (utf8Str) {
      return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
    },
    /**
     * Converts a byte array to a word array.
     *
     * @param {byte[]} bytes.
     *
     * @return {WordArray} The word array.
     *
     * @static
     *
     * @example
     *
     *     var wordArray = CryptoJS.enc.Utf8.parseFromByteArray(bytes);
     */
    parseFromByteArray: function (bytes) {
      return Latin1.bytes2words(bytes);
    }
  };

  /**
   * Abstract buffered block algorithm template.
   *
   * The property blockSize must be implemented in a concrete subtype.
   *
   * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
   */
  var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
    /**
     * Resets this block algorithm's data buffer to its initial state.
     *
     * @example
     *
     *     bufferedBlockAlgorithm.reset();
     */
    reset: function () {
      // Initial values
      this._data = new WordArray.init();
      this._nDataBytes = 0;
    },

    /**
     * Adds new data to this block algorithm's buffer.
     *
     * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
     *
     * @example
     *
     *     bufferedBlockAlgorithm._append('data');
     *     bufferedBlockAlgorithm._append(wordArray);
     */
    _append: function (data) {
      // Convert string to WordArray, else assume WordArray already
      if (typeof data == 'string') {
        data = Utf8.parse(data);
      }
      else {
        data = Utf8.parseFromByteArray(data);
      }

      // Append
      this._data.concat(data);
      this._nDataBytes += data.sigBytes;
    },

    /**
     * Processes available data blocks.
     *
     * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
     *
     * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
     *
     * @return {WordArray} The processed data.
     *
     * @example
     *
     *     var processedData = bufferedBlockAlgorithm._process();
     *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
     */
    _process: function (doFlush) {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;
      var dataSigBytes = data.sigBytes;
      var blockSize = this.blockSize;
      var blockSizeBytes = blockSize * 4;

      // Count blocks ready
      var nBlocksReady = dataSigBytes / blockSizeBytes;
      if (doFlush) {
        // Round up to include partial blocks
        nBlocksReady = Math.ceil(nBlocksReady);
      } else {
        // Round down to include only full blocks,
        // less the number of blocks that must remain in the buffer
        nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
      }

      // Count words ready
      var nWordsReady = nBlocksReady * blockSize;

      // Count bytes ready
      var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

      // Process blocks
      if (nWordsReady) {
        for (var offset = 0; offset < nWordsReady; offset += blockSize) {
          // Perform concrete-algorithm logic
          this._doProcessBlock(dataWords, offset);
        }

        // Remove processed words
        var processedWords = dataWords.splice(0, nWordsReady);
        data.sigBytes -= nBytesReady;
      }

      // Return processed words
      return new WordArray.init(processedWords, nBytesReady);
    },

    /**
     * Creates a copy of this object.
     *
     * @return {Object} The clone.
     *
     * @example
     *
     *     var clone = bufferedBlockAlgorithm.clone();
     */
    clone: function () {
      var clone = Base.clone.call(this);
      clone._data = this._data.clone();

      return clone;
    },

    _minBufferSize: 0
  });

  /**
   * Abstract hasher template.
   *
   * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
   */
  var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
    /**
     * Configuration options.
     */
    cfg: Base.extend(),

    /**
     * Initializes a newly created hasher.
     *
     * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
     *
     * @example
     *
     *     var hasher = CryptoJS.algo.SHA256.create();
     */
    init: function (cfg) {
      // Apply config defaults
      this.cfg = this.cfg.extend(cfg);

      // Set initial values
      this.reset();
    },

    /**
     * Resets this hasher to its initial state.
     *
     * @example
     *
     *     hasher.reset();
     */
    reset: function () {
      // Reset data buffer
      BufferedBlockAlgorithm.reset.call(this);

      // Perform concrete-hasher logic
      this._doReset();
    },

    /**
     * Updates this hasher with a message.
     *
     * @param {WordArray|string} messageUpdate The message to append.
     *
     * @return {Hasher} This hasher.
     *
     * @example
     *
     *     hasher.update('message');
     *     hasher.update(wordArray);
     */
    update: function (messageUpdate) {
      // Append
      this._append(messageUpdate);

      // Update the hash
      this._process();

      // Chainable
      return this;
    },

    /**
     * Finalizes the hash computation.
     * Note that the finalize operation is effectively a destructive, read-once operation.
     *
     * @param {WordArray|string} messageUpdate (Optional) A final message update.
     *
     * @return {WordArray} The hash.
     *
     * @example
     *
     *     var hash = hasher.finalize();
     *     var hash = hasher.finalize('message');
     *     var hash = hasher.finalize(wordArray);
     */
    finalize: function (messageUpdate) {
      // Final message update
      if (messageUpdate) {
        this._append(messageUpdate);
      }

      // Perform concrete-hasher logic
      var hash = this._doFinalize();

      return hash;
    },

    blockSize: 512 / 32,

    /**
     * Creates a shortcut function to a hasher's object interface.
     *
     * @param {Hasher} hasher The hasher to create a helper for.
     *
     * @return {Function} The shortcut function.
     *
     * @static
     *
     * @example
     *
     *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
     */
    _createHelper: function (hasher) {
      return function (message, cfg) {
        return new hasher.init(cfg).finalize(message);
      };
    },

    /**
     * Creates a shortcut function to the HMAC's object interface.
     *
     * @param {Hasher} hasher The hasher to use in this HMAC helper.
     *
     * @return {Function} The shortcut function.
     *
     * @static
     *
     * @example
     *
     *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
     */
    _createHmacHelper: function (hasher) {
      return function (message, key) {
        return new C_algo.HMAC.init(hasher, key).finalize(message);
      };
    }
  });

  /**
   * Algorithm namespace.
   */
  var C_algo = C.algo = {};

  return C;
}(Math));

//--------core end----------//
//--------x64-core start----------//
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function (undefined) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var Base = C_lib.Base;
  var X32WordArray = C_lib.WordArray;

  /**
   * x64 namespace.
   */
  var C_x64 = C.x64 = {};

  /**
   * A 64-bit word.
   */
  var X64Word = C_x64.Word = Base.extend({
    /**
     * Initializes a newly created 64-bit word.
     *
     * @param {number} high The high 32 bits.
     * @param {number} low The low 32 bits.
     *
     * @example
     *
     *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
     */
    init: function (high, low) {
      this.high = high;
      this.low = low;
    }

    /**
     * Bitwise NOTs this word.
     *
     * @return {X64Word} A new x64-Word object after negating.
     *
     * @example
     *
     *     var negated = x64Word.not();
     */
    // not: function () {
    // var high = ~this.high;
    // var low = ~this.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Bitwise ANDs this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to AND with this word.
     *
     * @return {X64Word} A new x64-Word object after ANDing.
     *
     * @example
     *
     *     var anded = x64Word.and(anotherX64Word);
     */
    // and: function (word) {
    // var high = this.high & word.high;
    // var low = this.low & word.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Bitwise ORs this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to OR with this word.
     *
     * @return {X64Word} A new x64-Word object after ORing.
     *
     * @example
     *
     *     var ored = x64Word.or(anotherX64Word);
     */
    // or: function (word) {
    // var high = this.high | word.high;
    // var low = this.low | word.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Bitwise XORs this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to XOR with this word.
     *
     * @return {X64Word} A new x64-Word object after XORing.
     *
     * @example
     *
     *     var xored = x64Word.xor(anotherX64Word);
     */
    // xor: function (word) {
    // var high = this.high ^ word.high;
    // var low = this.low ^ word.low;

    // return X64Word.create(high, low);
    // },

    /**
     * Shifts this word n bits to the left.
     *
     * @param {number} n The number of bits to shift.
     *
     * @return {X64Word} A new x64-Word object after shifting.
     *
     * @example
     *
     *     var shifted = x64Word.shiftL(25);
     */
    // shiftL: function (n) {
    // if (n < 32) {
    // var high = (this.high << n) | (this.low >>> (32 - n));
    // var low = this.low << n;
    // } else {
    // var high = this.low << (n - 32);
    // var low = 0;
    // }

    // return X64Word.create(high, low);
    // },

    /**
     * Shifts this word n bits to the right.
     *
     * @param {number} n The number of bits to shift.
     *
     * @return {X64Word} A new x64-Word object after shifting.
     *
     * @example
     *
     *     var shifted = x64Word.shiftR(7);
     */
    // shiftR: function (n) {
    // if (n < 32) {
    // var low = (this.low >>> n) | (this.high << (32 - n));
    // var high = this.high >>> n;
    // } else {
    // var low = this.high >>> (n - 32);
    // var high = 0;
    // }

    // return X64Word.create(high, low);
    // },

    /**
     * Rotates this word n bits to the left.
     *
     * @param {number} n The number of bits to rotate.
     *
     * @return {X64Word} A new x64-Word object after rotating.
     *
     * @example
     *
     *     var rotated = x64Word.rotL(25);
     */
    // rotL: function (n) {
    // return this.shiftL(n).or(this.shiftR(64 - n));
    // },

    /**
     * Rotates this word n bits to the right.
     *
     * @param {number} n The number of bits to rotate.
     *
     * @return {X64Word} A new x64-Word object after rotating.
     *
     * @example
     *
     *     var rotated = x64Word.rotR(7);
     */
    // rotR: function (n) {
    // return this.shiftR(n).or(this.shiftL(64 - n));
    // },

    /**
     * Adds this word with the passed word.
     *
     * @param {X64Word} word The x64-Word to add with this word.
     *
     * @return {X64Word} A new x64-Word object after adding.
     *
     * @example
     *
     *     var added = x64Word.add(anotherX64Word);
     */
    // add: function (word) {
    // var low = (this.low + word.low) | 0;
    // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
    // var high = (this.high + word.high + carry) | 0;

    // return X64Word.create(high, low);
    // }
  });

  /**
   * An array of 64-bit words.
   *
   * @property {Array} words The array of CryptoJS.x64.Word objects.
   * @property {number} sigBytes The number of significant bytes in this word array.
   */
  var X64WordArray = C_x64.WordArray = Base.extend({
    /**
     * Initializes a newly created word array.
     *
     * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
     * @param {number} sigBytes (Optional) The number of significant bytes in the words.
     *
     * @example
     *
     *     var wordArray = CryptoJS.x64.WordArray.create();
     *
     *     var wordArray = CryptoJS.x64.WordArray.create([
     *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
     *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
     *     ]);
     *
     *     var wordArray = CryptoJS.x64.WordArray.create([
     *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
     *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
     *     ], 10);
     */
    init: function (words, sigBytes) {
      words = this.words = words || [];

      if (sigBytes != undefined) {
        this.sigBytes = sigBytes;
      } else {
        this.sigBytes = words.length * 8;
      }
    },

    /**
     * Converts this 64-bit word array to a 32-bit word array.
     *
     * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
     *
     * @example
     *
     *     var x32WordArray = x64WordArray.toX32();
     */
    toX32: function () {
      // Shortcuts
      var x64Words = this.words;
      var x64WordsLength = x64Words.length;

      // Convert
      var x32Words = [];
      for (var i = 0; i < x64WordsLength; i++) {
        var x64Word = x64Words[i];
        x32Words.push(x64Word.high);
        x32Words.push(x64Word.low);
      }

      return X32WordArray.create(x32Words, this.sigBytes);
    },

    /**
     * Creates a copy of this word array.
     *
     * @return {X64WordArray} The clone.
     *
     * @example
     *
     *     var clone = x64WordArray.clone();
     */
    clone: function () {
      var clone = Base.clone.call(this);

      // Clone "words" array
      var words = clone.words = this.words.slice(0);

      // Clone each X64Word object
      var wordsLength = words.length;
      for (var i = 0; i < wordsLength; i++) {
        words[i] = words[i].clone();
      }

      return clone;
    }
  });
}());

//--------x64-core end----------//
//----------sha3 start--------//

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function (Math) {
  // Shortcuts
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var Hasher = C_lib.Hasher;
  var C_x64 = C.x64;
  var X64Word = C_x64.Word;
  var C_algo = C.algo;

  // Constants tables
  var RHO_OFFSETS = [];
  var PI_INDEXES = [];
  var ROUND_CONSTANTS = [];

  // Compute Constants
  (function () {
    // Compute rho offset constants
    var x = 1, y = 0;
    for (var t = 0; t < 24; t++) {
      RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

      var newX = y % 5;
      var newY = (2 * x + 3 * y) % 5;
      x = newX;
      y = newY;
    }

    // Compute pi index constants
    for (var x = 0; x < 5; x++) {
      for (var y = 0; y < 5; y++) {
        PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
      }
    }

    // Compute round constants
    var LFSR = 0x01;
    for (var i = 0; i < 24; i++) {
      var roundConstantMsw = 0;
      var roundConstantLsw = 0;

      for (var j = 0; j < 7; j++) {
        if (LFSR & 0x01) {
          var bitPosition = (1 << j) - 1;
          if (bitPosition < 32) {
            roundConstantLsw ^= 1 << bitPosition;
          } else /* if (bitPosition >= 32) */ {
            roundConstantMsw ^= 1 << (bitPosition - 32);
          }
        }

        // Compute next LFSR
        if (LFSR & 0x80) {
          // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
          LFSR = (LFSR << 1) ^ 0x71;
        } else {
          LFSR <<= 1;
        }
      }

      ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
    }
  }());

  // Reusable objects for temporary values
  var T = [];
  (function () {
    for (var i = 0; i < 25; i++) {
      T[i] = X64Word.create();
    }
  }());

  /**
   * SHA-3 hash algorithm.
   */
  var SHA3 = C_algo.SHA3 = Hasher.extend({
    /**
     * Configuration options.
     *
     * @property {number} outputLength
     *   The desired number of bits in the output hash.
     *   Only values permitted are: 224, 256, 384, 512.
     *   Default: 512
     */
    cfg: Hasher.cfg.extend({
      outputLength: 256
    }),

    _doReset: function () {
      var state = this._state = []
      for (var i = 0; i < 25; i++) {
        state[i] = new X64Word.init();
      }

      this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
    },

    _doProcessBlock: function (M, offset) {
      // Shortcuts
      var state = this._state;
      var nBlockSizeLanes = this.blockSize / 2;

      // Absorb
      for (var i = 0; i < nBlockSizeLanes; i++) {
        // Shortcuts
        var M2i = M[offset + 2 * i];
        var M2i1 = M[offset + 2 * i + 1];

        // Swap endian
        M2i = (
            (((M2i << 8) | (M2i >>> 24)) & 0x00ff00ff) |
            (((M2i << 24) | (M2i >>> 8)) & 0xff00ff00)
        );
        M2i1 = (
            (((M2i1 << 8) | (M2i1 >>> 24)) & 0x00ff00ff) |
            (((M2i1 << 24) | (M2i1 >>> 8)) & 0xff00ff00)
        );

        // Absorb message into state
        var lane = state[i];
        lane.high ^= M2i1;
        lane.low ^= M2i;
      }

      // Rounds
      for (var round = 0; round < 24; round++) {
        // Theta
        for (var x = 0; x < 5; x++) {
          // Mix column lanes
          var tMsw = 0, tLsw = 0;
          for (var y = 0; y < 5; y++) {
            var lane = state[x + 5 * y];
            tMsw ^= lane.high;
            tLsw ^= lane.low;
          }

          // Temporary values
          var Tx = T[x];
          Tx.high = tMsw;
          Tx.low = tLsw;
        }
        for (var x = 0; x < 5; x++) {
          // Shortcuts
          var Tx4 = T[(x + 4) % 5];
          var Tx1 = T[(x + 1) % 5];
          var Tx1Msw = Tx1.high;
          var Tx1Lsw = Tx1.low;

          // Mix surrounding columns
          var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
          var tLsw = Tx4.low ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
          for (var y = 0; y < 5; y++) {
            var lane = state[x + 5 * y];
            lane.high ^= tMsw;
            lane.low ^= tLsw;
          }
        }

        // Rho Pi
        for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
          // Shortcuts
          var lane = state[laneIndex];
          var laneMsw = lane.high;
          var laneLsw = lane.low;
          var rhoOffset = RHO_OFFSETS[laneIndex];

          // Rotate lanes
          if (rhoOffset < 32) {
            var tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
            var tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
          } else /* if (rhoOffset >= 32) */ {
            var tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64
                - rhoOffset));
            var tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64
                - rhoOffset));
          }

          // Transpose lanes
          var TPiLane = T[PI_INDEXES[laneIndex]];
          TPiLane.high = tMsw;
          TPiLane.low = tLsw;
        }

        // Rho pi at x = y = 0
        var T0 = T[0];
        var state0 = state[0];
        T0.high = state0.high;
        T0.low = state0.low;

        // Chi
        for (var x = 0; x < 5; x++) {
          for (var y = 0; y < 5; y++) {
            // Shortcuts
            var laneIndex = x + 5 * y;
            var lane = state[laneIndex];
            var TLane = T[laneIndex];
            var Tx1Lane = T[((x + 1) % 5) + 5 * y];
            var Tx2Lane = T[((x + 2) % 5) + 5 * y];

            // Mix rows
            lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
            lane.low = TLane.low ^ (~Tx1Lane.low & Tx2Lane.low);
          }
        }

        // Iota
        var lane = state[0];
        var roundConstant = ROUND_CONSTANTS[round];
        lane.high ^= roundConstant.high;
        lane.low ^= roundConstant.low;
        ;
      }
    },

    _doFinalize: function () {
      // Shortcuts
      var data = this._data;
      var dataWords = data.words;
      var nBitsTotal = this._nDataBytes * 8;
      var nBitsLeft = data.sigBytes * 8;
      var blockSizeBits = this.blockSize * 32;

      // Add padding
      dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
      dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits)
          >>> 5) - 1] |= 0x80;
      data.sigBytes = dataWords.length * 4;

      // Hash final blocks
      this._process();

      // Shortcuts
      var state = this._state;
      var outputLengthBytes = this.cfg.outputLength / 8;
      var outputLengthLanes = outputLengthBytes / 8;

      // Squeeze
      var hashWords = [];
      for (var i = 0; i < outputLengthLanes; i++) {
        // Shortcuts
        var lane = state[i];
        var laneMsw = lane.high;
        var laneLsw = lane.low;

        // Swap endian
        laneMsw = (
            (((laneMsw << 8) | (laneMsw >>> 24)) & 0x00ff00ff) |
            (((laneMsw << 24) | (laneMsw >>> 8)) & 0xff00ff00)
        );
        laneLsw = (
            (((laneLsw << 8) | (laneLsw >>> 24)) & 0x00ff00ff) |
            (((laneLsw << 24) | (laneLsw >>> 8)) & 0xff00ff00)
        );

        // Squeeze state to retrieve hash
        hashWords.push(laneLsw);
        hashWords.push(laneMsw);
      }

      // Return final computed hash
      return new WordArray.init(hashWords, outputLengthBytes);
    },

    clone: function () {
      var clone = Hasher.clone.call(this);

      var state = clone._state = this._state.slice(0);
      for (var i = 0; i < 25; i++) {
        state[i] = state[i].clone();
      }

      return clone;
    }
  });

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   *
   * @return {WordArray} The hash.
   *
   * @static
   *
   * @example
   *
   *     var hash = CryptoJS.SHA3('message');
   *     var hash = CryptoJS.SHA3(wordArray);
   */
  C.SHA3 = Hasher._createHelper(SHA3);

  /**
   * Shortcut function to the HMAC's object interface.
   *
   * @param {WordArray|string} message The message to hash.
   * @param {WordArray|string} key The secret key.
   *
   * @return {WordArray} The HMAC.
   *
   * @static
   *
   * @example
   *
   *     var hmac = CryptoJS.HmacSHA3(message, key);
   */
  C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
}(Math));

//----------sha3 end--------//
//----------ecc start--------//

/*
A JavaScript implementation of the ecc genKeyPairã€signã€vrify

This software is licensed under the MIT License.

Copyright Fedor Indutny, 2014.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
!function (a) {
  if ("object" == typeof exports && "undefined"
      != typeof module) {
    module.exports = a();
  } else if ("function"
      == typeof define && define.amd) {
    define([], a);
  } else {
    var b;
    b = "undefined" != typeof window ? window : "undefined" != typeof global
        ? global : "undefined" != typeof self ? self : this, b.elliptic = a()
  }
}(function () {
  return function a(b, c, d) {
    function e(g, h) {
      if (!c[g]) {
        if (!b[g]) {
          var i = "function" == typeof require && require;
          if (!h && i) {
            return i(g, !0);
          }
          if (f) {
            return f(g, !0);
          }
          var j = new Error("Cannot find module '" + g + "'");
          throw j.code = "MODULE_NOT_FOUND", j
        }
        var k = c[g] = {exports: {}};
        b[g][0].call(k.exports, function (a) {
          var c = b[g][1][a];
          return e(c ? c : a)
        }, k, k.exports, a, b, c, d)
      }
      return c[g].exports
    }

    for (var f = "function" == typeof require && require, g = 0; g < d.length;
        g++) {
      e(d[g]);
    }
    return e
  }({
    1: [function (a, b, c) {
      "use strict";
      var d = c;
      d.version = a("../package.json").version, d.utils = a(
          "./elliptic/utils"), d.rand = a("brorand"), d.curve = a(
          "./elliptic/curve"), d.curves = a("./elliptic/curves"), d.ec = a(
          "./elliptic/ec"), d.eddsa = a("./elliptic/eddsa")
    }, {
      "../package.json": 30,
      "./elliptic/curve": 4,
      "./elliptic/curves": 7,
      "./elliptic/ec": 8,
      "./elliptic/eddsa": 11,
      "./elliptic/utils": 15,
      brorand: 17
    }],
    2: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        this.type = a, this.p = new f(b.p, 16), this.red = b.prime ? f.red(
            b.prime) : f.mont(this.p), this.zero = new f(0).toRed(
            this.red), this.one = new f(1).toRed(this.red), this.two = new f(
            2).toRed(this.red), this.n = b.n && new f(b.n, 16), this.g = b.g
            && this.pointFromJSON(b.g, b.gRed), this._wnafT1 = new Array(
            4), this._wnafT2 = new Array(4), this._wnafT3 = new Array(
            4), this._wnafT4 = new Array(4);
        var c = this.n && this.p.div(this.n);
        !c || c.cmpn(100) > 0 ? this.redN = null
            : (this._maxwellTrick = !0, this.redN = this.n.toRed(this.red))
      }

      function e(a, b) {
        this.curve = a, this.type = b, this.precomputed = null
      }

      var f = a("bn.js"), g = a("../../elliptic"), h = g.utils, i = h.getNAF,
          j = h.getJSF, k = h.assert;
      b.exports = d, d.prototype.point = function () {
        throw new Error("Not implemented")
      }, d.prototype.validate = function () {
        throw new Error("Not implemented")
      }, d.prototype._fixedNafMul = function (a, b) {
        k(a.precomputed);
        var c = a._getDoubles(), d = i(b, 1),
            e = (1 << c.step + 1) - (c.step % 2 === 0 ? 2 : 1);
        e /= 3;
        for (var f = [], g = 0; g < d.length; g += c.step) {
          for (var h = 0, b = g + c.step - 1; b >= g; b--) {
            h = (h << 1) + d[b];
          }
          f.push(h)
        }
        for (var j = this.jpoint(null, null, null),
            l = this.jpoint(null, null, null), m = e; m > 0; m--) {
          for (var g = 0; g < f.length; g++) {
            var h = f[g];
            h === m ? l = l.mixedAdd(c.points[g]) : h === -m && (l = l.mixedAdd(
                c.points[g].neg()))
          }
          j = j.add(l)
        }
        return j.toP()
      }, d.prototype._wnafMul = function (a, b) {
        var c = 4, d = a._getNAFPoints(c);
        c = d.wnd;
        for (var e = d.points, f = i(b, c), g = this.jpoint(null, null, null),
            h = f.length - 1; h >= 0; h--) {
          for (var b = 0; h >= 0 && 0 === f[h]; h--) {
            b++;
          }
          if (h >= 0 && b++ , g = g.dblp(b), h < 0) {
            break;
          }
          var j = f[h];
          k(0 !== j), g = "affine" === a.type ? j > 0 ? g.mixedAdd(
              e[j - 1 >> 1]) : g.mixedAdd(e[-j - 1 >> 1].neg()) : j > 0 ? g.add(
              e[j - 1 >> 1]) : g.add(e[-j - 1 >> 1].neg())
        }
        return "affine" === a.type ? g.toP() : g
      }, d.prototype._wnafMulAdd = function (a, b, c, d, e) {
        for (var f = this._wnafT1, g = this._wnafT2, h = this._wnafT3, k = 0,
            l = 0; l < d; l++) {
          var m = b[l], n = m._getNAFPoints(a);
          f[l] = n.wnd, g[l] = n.points
        }
        for (var l = d - 1; l >= 1; l -= 2) {
          var o = l - 1, p = l;
          if (1 === f[o] && 1 === f[p]) {
            var q = [b[o], null, null, b[p]];
            0 === b[o].y.cmp(b[p].y) ? (q[1] = b[o].add(
                b[p]), q[2] = b[o].toJ().mixedAdd(b[p].neg())) : 0
            === b[o].y.cmp(b[p].y.redNeg()) ? (q[1] = b[o].toJ().mixedAdd(
                b[p]), q[2] = b[o].add(b[p].neg()))
                : (q[1] = b[o].toJ().mixedAdd(b[p]), q[2] = b[o].toJ().mixedAdd(
                    b[p].neg()));
            var r = [-3, -1, -5, -7, 0, 7, 5, 1, 3], s = j(c[o], c[p]);
            k = Math.max(s[0].length, k), h[o] = new Array(k), h[p] = new Array(
                k);
            for (var t = 0; t < k; t++) {
              var u = 0 | s[0][t], v = 0 | s[1][t];
              h[o][t] = r[3 * (u + 1) + (v + 1)], h[p][t] = 0, g[o] = q
            }
          } else {
            h[o] = i(c[o], f[o]), h[p] = i(c[p], f[p]), k = Math.max(
                h[o].length, k), k = Math.max(h[p].length, k)
          }
        }
        for (var w = this.jpoint(null, null, null), x = this._wnafT4, l = k;
            l >= 0; l--) {
          for (var y = 0; l >= 0;) {
            for (var z = !0, t = 0; t < d; t++) {
              x[t] = 0 | h[t][l], 0 !== x[t]
              && (z = !1);
            }
            if (!z) {
              break;
            }
            y++ , l--
          }
          if (l >= 0 && y++ , w = w.dblp(y), l < 0) {
            break;
          }
          for (var t = 0; t < d; t++) {
            var m, A = x[t];
            0 !== A && (A > 0 ? m = g[t][A - 1 >> 1] : A < 0 && (m = g[t][-A - 1
            >> 1].neg()), w = "affine" === m.type ? w.mixedAdd(m) : w.add(m))
          }
        }
        for (var l = 0; l < d; l++) {
          g[l] = null;
        }
        return e ? w : w.toP()
      }, d.BasePoint = e, e.prototype.eq = function () {
        throw new Error("Not implemented")
      }, e.prototype.validate = function () {
        return this.curve.validate(this)
      }, d.prototype.decodePoint = function (a, b) {
        a = h.toArray(a, b);
        var c = this.p.byteLength();
        if ((4 === a[0] || 6 === a[0] || 7 === a[0]) && a.length - 1 === 2
            * c) {
          6 === a[0] ? k(a[a.length - 1] % 2 === 0) : 7 === a[0] && k(a[a.length
          - 1] % 2 === 1);
          var d = this.point(a.slice(1, 1 + c), a.slice(1 + c, 1 + 2 * c));
          return d
        }
        if ((2 === a[0] || 3 === a[0]) && a.length - 1
            === c) {
          return this.pointFromX(a.slice(1, 1 + c), 3 === a[0]);
        }
        throw new Error("Unknown point format")
      }, e.prototype.encodeCompressed = function (a) {
        return this.encode(a, !0)
      }, e.prototype._encode = function (a) {
        var b = this.curve.p.byteLength(), c = this.getX().toArray("be", b);
        return a ? [this.getY().isEven() ? 2 : 3].concat(c) : [4].concat(c,
            this.getY().toArray("be", b))
      }, e.prototype.encode = function (a, b) {
        return h.encode(this._encode(b), a)
      }, e.prototype.precompute = function (a) {
        if (this.precomputed) {
          return this;
        }
        var b = {doubles: null, naf: null, beta: null};
        return b.naf = this._getNAFPoints(8), b.doubles = this._getDoubles(4,
            a), b.beta = this._getBeta(), this.precomputed = b, this
      }, e.prototype._hasDoubles = function (a) {
        if (!this.precomputed) {
          return !1;
        }
        var b = this.precomputed.doubles;
        return !!b && b.points.length >= Math.ceil((a.bitLength() + 1) / b.step)
      }, e.prototype._getDoubles = function (a, b) {
        if (this.precomputed
            && this.precomputed.doubles) {
          return this.precomputed.doubles;
        }
        for (var c = [this], d = this, e = 0; e < b; e += a) {
          for (var f = 0; f < a; f++) {
            d = d.dbl();
          }
          c.push(d)
        }
        return {step: a, points: c}
      }, e.prototype._getNAFPoints = function (a) {
        if (this.precomputed
            && this.precomputed.naf) {
          return this.precomputed.naf;
        }
        for (var b = [this], c = (1 << a) - 1, d = 1 === c ? null : this.dbl(),
            e = 1; e < c; e++) {
          b[e] = b[e - 1].add(d);
        }
        return {wnd: a, points: b}
      }, e.prototype._getBeta = function () {
        return null
      }, e.prototype.dblp = function (a) {
        for (var b = this, c = 0; c < a; c++) {
          b = b.dbl();
        }
        return b
      }
    }, {"../../elliptic": 1, "bn.js": 16}],
    3: [function (a, b, c) {
      "use strict";

      function d(a) {
        this.twisted = 1 !== (0 | a.a), this.mOneA = this.twisted && (0 | a.a)
            === -1, this.extended = this.mOneA, j.call(this, "edwards",
            a), this.a = new h(a.a, 16).umod(this.red.m), this.a = this.a.toRed(
            this.red), this.c = new h(a.c, 16).toRed(
            this.red), this.c2 = this.c.redSqr(), this.d = new h(a.d, 16).toRed(
            this.red), this.dd = this.d.redAdd(this.d), k(!this.twisted || 0
            === this.c.fromRed().cmpn(1)), this.oneC = 1 === (0 | a.c)
      }

      function e(a, b, c, d, e) {
        j.BasePoint.call(this, a, "projective"), null === b && null === c
        && null === d
            ? (this.x = this.curve.zero, this.y = this.curve.one, this.z = this.curve.one, this.t = this.curve.zero, this.zOne = !0)
            : (this.x = new h(b, 16), this.y = new h(c, 16), this.z = d ? new h(
                d, 16) : this.curve.one, this.t = e && new h(e, 16), this.x.red
            || (this.x = this.x.toRed(this.curve.red)), this.y.red
            || (this.y = this.y.toRed(this.curve.red)), this.z.red
            || (this.z = this.z.toRed(this.curve.red)), this.t && !this.t.red
            && (this.t = this.t.toRed(this.curve.red)), this.zOne = this.z
                === this.curve.one, this.curve.extended && !this.t
            && (this.t = this.x.redMul(this.y), this.zOne
            || (this.t = this.t.redMul(this.z.redInvm()))))
      }

      var f = a("../curve"), g = a("../../elliptic"), h = a("bn.js"),
          i = a("inherits"), j = f.base, k = g.utils.assert;
      i(d, j), b.exports = d, d.prototype._mulA = function (a) {
        return this.mOneA ? a.redNeg() : this.a.redMul(a)
      }, d.prototype._mulC = function (a) {
        return this.oneC ? a : this.c.redMul(a)
      }, d.prototype.jpoint = function (a, b, c, d) {
        return this.point(a, b, c, d)
      }, d.prototype.pointFromX = function (a, b) {
        a = new h(a, 16), a.red || (a = a.toRed(this.red));
        var c = a.redSqr(), d = this.c2.redSub(this.a.redMul(c)),
            e = this.one.redSub(this.c2.redMul(this.d).redMul(c)),
            f = d.redMul(e.redInvm()), g = f.redSqrt();
        if (0 !== g.redSqr().redSub(f).cmp(this.zero)) {
          throw new Error(
              "invalid point");
        }
        var i = g.fromRed().isOdd();
        return (b && !i || !b && i) && (g = g.redNeg()), this.point(a, g)
      }, d.prototype.pointFromY = function (a, b) {
        a = new h(a, 16), a.red || (a = a.toRed(this.red));
        var c = a.redSqr(), d = c.redSub(this.one),
            e = c.redMul(this.d).redAdd(this.one), f = d.redMul(e.redInvm());
        if (0 === f.cmp(this.zero)) {
          if (b) {
            throw new Error("invalid point");
          }
          return this.point(this.zero, a)
        }
        var g = f.redSqrt();
        if (0 !== g.redSqr().redSub(f).cmp(this.zero)) {
          throw new Error(
              "invalid point");
        }
        return g.isOdd() !== b && (g = g.redNeg()), this.point(g, a)
      }, d.prototype.validate = function (a) {
        if (a.isInfinity()) {
          return !0;
        }
        a.normalize();
        var b = a.x.redSqr(), c = a.y.redSqr(), d = b.redMul(this.a).redAdd(c),
            e = this.c2.redMul(this.one.redAdd(this.d.redMul(b).redMul(c)));
        return 0 === d.cmp(e)
      }, i(e, j.BasePoint), d.prototype.pointFromJSON = function (a) {
        return e.fromJSON(this, a)
      }, d.prototype.point = function (a, b, c, d) {
        return new e(this, a, b, c, d)
      }, e.fromJSON = function (a, b) {
        return new e(a, b[0], b[1], b[2])
      }, e.prototype.inspect = function () {
        return this.isInfinity() ? "<EC Point Infinity>" : "<EC Point x: "
            + this.x.fromRed().toString(16, 2) + " y: "
            + this.y.fromRed().toString(16, 2) + " z: "
            + this.z.fromRed().toString(16, 2) + ">"
      }, e.prototype.isInfinity = function () {
        return 0 === this.x.cmpn(0) && 0 === this.y.cmp(this.z)
      }, e.prototype._extDbl = function () {
        var a = this.x.redSqr(), b = this.y.redSqr(), c = this.z.redSqr();
        c = c.redIAdd(c);
        var d = this.curve._mulA(a),
            e = this.x.redAdd(this.y).redSqr().redISub(a).redISub(b),
            f = d.redAdd(b), g = f.redSub(c), h = d.redSub(b), i = e.redMul(g),
            j = f.redMul(h), k = e.redMul(h), l = g.redMul(f);
        return this.curve.point(i, j, l, k)
      }, e.prototype._projDbl = function () {
        var a, b, c, d = this.x.redAdd(this.y).redSqr(), e = this.x.redSqr(),
            f = this.y.redSqr();
        if (this.curve.twisted) {
          var g = this.curve._mulA(e), h = g.redAdd(f);
          if (this.zOne) {
            a = d.redSub(e).redSub(f).redMul(
                h.redSub(this.curve.two)), b = h.redMul(
                g.redSub(f)), c = h.redSqr().redSub(h).redSub(h);
          } else {
            var i = this.z.redSqr(), j = h.redSub(i).redISub(i);
            a = d.redSub(e).redISub(f).redMul(j), b = h.redMul(
                g.redSub(f)), c = h.redMul(j)
          }
        } else {
          var g = e.redAdd(f),
              i = this.curve._mulC(this.c.redMul(this.z)).redSqr(),
              j = g.redSub(i).redSub(i);
          a = this.curve._mulC(d.redISub(g)).redMul(j), b = this.curve._mulC(
              g).redMul(e.redISub(f)), c = g.redMul(j)
        }
        return this.curve.point(a, b, c)
      }, e.prototype.dbl = function () {
        return this.isInfinity() ? this : this.curve.extended ? this._extDbl()
            : this._projDbl()
      }, e.prototype._extAdd = function (a) {
        var b = this.y.redSub(this.x).redMul(a.y.redSub(a.x)),
            c = this.y.redAdd(this.x).redMul(a.y.redAdd(a.x)),
            d = this.t.redMul(this.curve.dd).redMul(a.t),
            e = this.z.redMul(a.z.redAdd(a.z)), f = c.redSub(b),
            g = e.redSub(d), h = e.redAdd(d), i = c.redAdd(b), j = f.redMul(g),
            k = h.redMul(i), l = f.redMul(i), m = g.redMul(h);
        return this.curve.point(j, k, m, l)
      }, e.prototype._projAdd = function (a) {
        var b, c, d = this.z.redMul(a.z), e = d.redSqr(),
            f = this.x.redMul(a.x), g = this.y.redMul(a.y),
            h = this.curve.d.redMul(f).redMul(g), i = e.redSub(h),
            j = e.redAdd(h),
            k = this.x.redAdd(this.y).redMul(a.x.redAdd(a.y)).redISub(
                f).redISub(g), l = d.redMul(i).redMul(k);
        return this.curve.twisted ? (b = d.redMul(j).redMul(
            g.redSub(this.curve._mulA(f))), c = i.redMul(j)) : (b = d.redMul(
            j).redMul(g.redSub(f)), c = this.curve._mulC(i).redMul(
            j)), this.curve.point(l, b, c)
      }, e.prototype.add = function (a) {
        return this.isInfinity() ? a : a.isInfinity() ? this
            : this.curve.extended ? this._extAdd(a) : this._projAdd(a)
      }, e.prototype.mul = function (a) {
        return this._hasDoubles(a) ? this.curve._fixedNafMul(this, a)
            : this.curve._wnafMul(this, a)
      }, e.prototype.mulAdd = function (a, b, c) {
        return this.curve._wnafMulAdd(1, [this, b], [a, c], 2, !1)
      }, e.prototype.jmulAdd = function (a, b, c) {
        return this.curve._wnafMulAdd(1, [this, b], [a, c], 2, !0)
      }, e.prototype.normalize = function () {
        if (this.zOne) {
          return this;
        }
        var a = this.z.redInvm();
        return this.x = this.x.redMul(a), this.y = this.y.redMul(a), this.t
        && (this.t = this.t.redMul(
            a)), this.z = this.curve.one, this.zOne = !0, this
      }, e.prototype.neg = function () {
        return this.curve.point(this.x.redNeg(), this.y, this.z, this.t
            && this.t.redNeg())
      }, e.prototype.getX = function () {
        return this.normalize(), this.x.fromRed()
      }, e.prototype.getY = function () {
        return this.normalize(), this.y.fromRed()
      }, e.prototype.eq = function (a) {
        return this === a || 0 === this.getX().cmp(a.getX()) && 0
            === this.getY().cmp(a.getY())
      }, e.prototype.eqXToP = function (a) {
        var b = a.toRed(this.curve.red).redMul(this.z);
        if (0 === this.x.cmp(b)) {
          return !0;
        }
        for (var c = a.clone(), d = this.curve.redN.redMul(this.z); ;) {
          if (c.iadd(this.curve.n), c.cmp(this.curve.p) >= 0) {
            return !1;
          }
          if (b.redIAdd(d), 0 === this.x.cmp(b)) {
            return !0
          }
        }
        return !1
      }, e.prototype.toP = e.prototype.normalize, e.prototype.mixedAdd = e.prototype.add
    }, {"../../elliptic": 1, "../curve": 4, "bn.js": 16, inherits: 27}],
    4: [function (a, b, c) {
      "use strict";
      var d = c;
      d.base = a("./base"), d["short"] = a("./short"), d.mont = a(
          "./mont"), d.edwards = a("./edwards")
    }, {"./base": 2, "./edwards": 3, "./mont": 5, "./short": 6}],
    5: [function (a, b, c) {
      "use strict";

      function d(a) {
        i.call(this, "mont", a), this.a = new g(a.a, 16).toRed(
            this.red), this.b = new g(a.b, 16).toRed(this.red), this.i4 = new g(
            4).toRed(this.red).redInvm(), this.two = new g(2).toRed(
            this.red), this.a24 = this.i4.redMul(this.a.redAdd(this.two))
      }

      function e(a, b, c) {
        i.BasePoint.call(this, a, "projective"), null === b && null === c
            ? (this.x = this.curve.one, this.z = this.curve.zero)
            : (this.x = new g(b, 16), this.z = new g(c, 16), this.x.red
            || (this.x = this.x.toRed(this.curve.red)), this.z.red
            || (this.z = this.z.toRed(this.curve.red)))
      }

      var f = a("../curve"), g = a("bn.js"), h = a("inherits"), i = f.base,
          j = a("../../elliptic"), k = j.utils;
      h(d, i), b.exports = d, d.prototype.validate = function (a) {
        var b = a.normalize().x, c = b.redSqr(),
            d = c.redMul(b).redAdd(c.redMul(this.a)).redAdd(b), e = d.redSqrt();
        return 0 === e.redSqr().cmp(d)
      }, h(e, i.BasePoint), d.prototype.decodePoint = function (a, b) {
        return this.point(k.toArray(a, b), 1)
      }, d.prototype.point = function (a, b) {
        return new e(this, a, b)
      }, d.prototype.pointFromJSON = function (a) {
        return e.fromJSON(this, a)
      }, e.prototype.precompute = function () {
      }, e.prototype._encode = function () {
        return this.getX().toArray("be", this.curve.p.byteLength())
      }, e.fromJSON = function (a, b) {
        return new e(a, b[0], b[1] || a.one)
      }, e.prototype.inspect = function () {
        return this.isInfinity() ? "<EC Point Infinity>" : "<EC Point x: "
            + this.x.fromRed().toString(16, 2) + " z: "
            + this.z.fromRed().toString(16, 2) + ">"
      }, e.prototype.isInfinity = function () {
        return 0 === this.z.cmpn(0)
      }, e.prototype.dbl = function () {
        var a = this.x.redAdd(this.z), b = a.redSqr(),
            c = this.x.redSub(this.z), d = c.redSqr(), e = b.redSub(d),
            f = b.redMul(d), g = e.redMul(d.redAdd(this.curve.a24.redMul(e)));
        return this.curve.point(f, g)
      }, e.prototype.add = function () {
        throw new Error("Not supported on Montgomery curve")
      }, e.prototype.diffAdd = function (a, b) {
        var c = this.x.redAdd(this.z), d = this.x.redSub(this.z),
            e = a.x.redAdd(a.z), f = a.x.redSub(a.z), g = f.redMul(c),
            h = e.redMul(d), i = b.z.redMul(g.redAdd(h).redSqr()),
            j = b.x.redMul(g.redISub(h).redSqr());
        return this.curve.point(i, j)
      }, e.prototype.mul = function (a) {
        for (var b = a.clone(), c = this, d = this.curve.point(null, null),
            e = this, f = []; 0 !== b.cmpn(0); b.iushrn(1)) {
          f.push(b.andln(1));
        }
        for (var g = f.length - 1; g >= 0; g--) {
          0 === f[g] ? (c = c.diffAdd(d,
              e), d = d.dbl()) : (d = c.diffAdd(d, e), c = c.dbl());
        }
        return d
      }, e.prototype.mulAdd = function () {
        throw new Error("Not supported on Montgomery curve")
      }, e.prototype.jumlAdd = function () {
        throw new Error("Not supported on Montgomery curve")
      }, e.prototype.eq = function (a) {
        return 0 === this.getX().cmp(a.getX())
      }, e.prototype.normalize = function () {
        return this.x = this.x.redMul(
            this.z.redInvm()), this.z = this.curve.one, this
      }, e.prototype.getX = function () {
        return this.normalize(), this.x.fromRed()
      }
    }, {"../../elliptic": 1, "../curve": 4, "bn.js": 16, inherits: 27}],
    6: [function (a, b, c) {
      "use strict";

      function d(a) {
        k.call(this, "short", a), this.a = new i(a.a, 16).toRed(
            this.red), this.b = new i(a.b, 16).toRed(
            this.red), this.tinv = this.two.redInvm(), this.zeroA = 0
            === this.a.fromRed().cmpn(0), this.threeA = 0
            === this.a.fromRed().sub(this.p).cmpn(
                -3), this.endo = this._getEndomorphism(
            a), this._endoWnafT1 = new Array(4), this._endoWnafT2 = new Array(4)
      }

      function e(a, b, c, d) {
        k.BasePoint.call(this, a, "affine"), null === b && null === c
            ? (this.x = null, this.y = null, this.inf = !0) : (this.x = new i(b,
                16), this.y = new i(c, 16), d && (this.x.forceRed(
                this.curve.red), this.y.forceRed(this.curve.red)), this.x.red
            || (this.x = this.x.toRed(this.curve.red)), this.y.red
            || (this.y = this.y.toRed(this.curve.red)), this.inf = !1)
      }

      function f(a, b, c, d) {
        k.BasePoint.call(this, a, "jacobian"), null === b && null === c && null
        === d
            ? (this.x = this.curve.one, this.y = this.curve.one, this.z = new i(
                0)) : (this.x = new i(b, 16), this.y = new i(c,
                16), this.z = new i(d, 16)), this.x.red
        || (this.x = this.x.toRed(this.curve.red)), this.y.red
        || (this.y = this.y.toRed(this.curve.red)), this.z.red
        || (this.z = this.z.toRed(this.curve.red)), this.zOne = this.z
            === this.curve.one
      }

      var g = a("../curve"), h = a("../../elliptic"), i = a("bn.js"),
          j = a("inherits"), k = g.base, l = h.utils.assert;
      j(d, k), b.exports = d, d.prototype._getEndomorphism = function (a) {
        if (this.zeroA && this.g && this.n && 1 === this.p.modn(3)) {
          var b, c;
          if (a.beta) {
            b = new i(a.beta, 16).toRed(this.red);
          } else {
            var d = this._getEndoRoots(this.p);
            b = d[0].cmp(d[1]) < 0 ? d[0] : d[1], b = b.toRed(this.red)
          }
          if (a.lambda) {
            c = new i(a.lambda, 16);
          } else {
            var e = this._getEndoRoots(this.n);
            0 === this.g.mul(e[0]).x.cmp(this.g.x.redMul(b)) ? c = e[0]
                : (c = e[1], l(0 === this.g.mul(c).x.cmp(this.g.x.redMul(b))))
          }
          var f;
          return f = a.basis ? a.basis.map(function (a) {
            return {a: new i(a.a, 16), b: new i(a.b, 16)}
          }) : this._getEndoBasis(c), {beta: b, lambda: c, basis: f}
        }
      }, d.prototype._getEndoRoots = function (a) {
        var b = a === this.p ? this.red : i.mont(a),
            c = new i(2).toRed(b).redInvm(), d = c.redNeg(),
            e = new i(3).toRed(b).redNeg().redSqrt().redMul(c),
            f = d.redAdd(e).fromRed(), g = d.redSub(e).fromRed();
        return [f, g]
      }, d.prototype._getEndoBasis = function (a) {
        for (var b, c, d, e, f, g, h, j, k,
            l = this.n.ushrn(Math.floor(this.n.bitLength() / 2)), m = a,
            n = this.n.clone(), o = new i(1), p = new i(0), q = new i(0),
            r = new i(1), s = 0; 0 !== m.cmpn(0);) {
          var t = n.div(m);
          j = n.sub(t.mul(m)), k = q.sub(t.mul(o));
          var u = r.sub(t.mul(p));
          if (!d && j.cmp(l)
              < 0) {
            b = h.neg(), c = o, d = j.neg(), e = k;
          } else if (d && 2
              === ++s) {
            break;
          }
          h = j, n = m, m = j, q = o, o = k, r = p, p = u
        }
        f = j.neg(), g = k;
        var v = d.sqr().add(e.sqr()), w = f.sqr().add(g.sqr());
        return w.cmp(v) >= 0 && (f = b, g = c), d.negative
        && (d = d.neg(), e = e.neg()), f.negative
        && (f = f.neg(), g = g.neg()), [{a: d, b: e}, {a: f, b: g}]
      }, d.prototype._endoSplit = function (a) {
        var b = this.endo.basis, c = b[0], d = b[1],
            e = d.b.mul(a).divRound(this.n),
            f = c.b.neg().mul(a).divRound(this.n), g = e.mul(c.a),
            h = f.mul(d.a), i = e.mul(c.b), j = f.mul(d.b), k = a.sub(g).sub(h),
            l = i.add(j).neg();
        return {k1: k, k2: l}
      }, d.prototype.pointFromX = function (a, b) {
        a = new i(a, 16), a.red || (a = a.toRed(this.red));
        var c = a.redSqr().redMul(a).redIAdd(a.redMul(this.a)).redIAdd(this.b),
            d = c.redSqrt();
        if (0 !== d.redSqr().redSub(c).cmp(this.zero)) {
          throw new Error(
              "invalid point");
        }
        var e = d.fromRed().isOdd();
        return (b && !e || !b && e) && (d = d.redNeg()), this.point(a, d)
      }, d.prototype.validate = function (a) {
        if (a.inf) {
          return !0;
        }
        var b = a.x, c = a.y, d = this.a.redMul(b),
            e = b.redSqr().redMul(b).redIAdd(d).redIAdd(this.b);
        return 0 === c.redSqr().redISub(e).cmpn(0)
      }, d.prototype._endoWnafMulAdd = function (a, b, c) {
        for (var d = this._endoWnafT1, e = this._endoWnafT2, f = 0;
            f < a.length; f++) {
          var g = this._endoSplit(b[f]), h = a[f], i = h._getBeta();
          g.k1.negative && (g.k1.ineg(), h = h.neg(!0)), g.k2.negative
          && (g.k2.ineg(), i = i.neg(!0)), d[2 * f] = h, d[2 * f + 1] = i, e[2
          * f] = g.k1, e[2 * f + 1] = g.k2
        }
        for (var j = this._wnafMulAdd(1, d, e, 2 * f, c), k = 0; k < 2 * f;
            k++) {
          d[k] = null, e[k] = null;
        }
        return j
      }, j(e, k.BasePoint), d.prototype.point = function (a, b, c) {
        return new e(this, a, b, c)
      }, d.prototype.pointFromJSON = function (a, b) {
        return e.fromJSON(this, a, b)
      }, e.prototype._getBeta = function () {
        if (this.curve.endo) {
          var a = this.precomputed;
          if (a && a.beta) {
            return a.beta;
          }
          var b = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
          if (a) {
            var c = this.curve, d = function (a) {
              return c.point(a.x.redMul(c.endo.beta), a.y)
            };
            a.beta = b, b.precomputed = {
              beta: null,
              naf: a.naf && {wnd: a.naf.wnd, points: a.naf.points.map(d)},
              doubles: a.doubles && {
                step: a.doubles.step,
                points: a.doubles.points.map(d)
              }
            }
          }
          return b
        }
      }, e.prototype.toJSON = function () {
        return this.precomputed ? [this.x, this.y, this.precomputed && {
          doubles: this.precomputed.doubles && {
            step: this.precomputed.doubles.step,
            points: this.precomputed.doubles.points.slice(1)
          },
          naf: this.precomputed.naf && {
            wnd: this.precomputed.naf.wnd,
            points: this.precomputed.naf.points.slice(1)
          }
        }] : [this.x, this.y]
      }, e.fromJSON = function (a, b, c) {
        function d(b) {
          return a.point(b[0], b[1], c)
        }

        "string" == typeof b && (b = JSON.parse(b));
        var e = a.point(b[0], b[1], c);
        if (!b[2]) {
          return e;
        }
        var f = b[2];
        return e.precomputed = {
          beta: null,
          doubles: f.doubles && {
            step: f.doubles.step,
            points: [e].concat(f.doubles.points.map(d))
          },
          naf: f.naf && {
            wnd: f.naf.wnd,
            points: [e].concat(f.naf.points.map(d))
          }
        }, e
      }, e.prototype.inspect = function () {
        return this.isInfinity() ? "<EC Point Infinity>" : "<EC Point x: "
            + this.x.fromRed().toString(16, 2) + " y: "
            + this.y.fromRed().toString(16, 2) + ">"
      }, e.prototype.isInfinity = function () {
        return this.inf
      }, e.prototype.add = function (a) {
        if (this.inf) {
          return a;
        }
        if (a.inf) {
          return this;
        }
        if (this.eq(a)) {
          return this.dbl();
        }
        if (this.neg().eq(a)) {
          return this.curve.point(null, null);
        }
        if (0 === this.x.cmp(a.x)) {
          return this.curve.point(null, null);
        }
        var b = this.y.redSub(a.y);
        0 !== b.cmpn(0) && (b = b.redMul(this.x.redSub(a.x).redInvm()));
        var c = b.redSqr().redISub(this.x).redISub(a.x),
            d = b.redMul(this.x.redSub(c)).redISub(this.y);
        return this.curve.point(c, d)
      }, e.prototype.dbl = function () {
        if (this.inf) {
          return this;
        }
        var a = this.y.redAdd(this.y);
        if (0 === a.cmpn(0)) {
          return this.curve.point(null, null);
        }
        var b = this.curve.a, c = this.x.redSqr(), d = a.redInvm(),
            e = c.redAdd(c).redIAdd(c).redIAdd(b).redMul(d),
            f = e.redSqr().redISub(this.x.redAdd(this.x)),
            g = e.redMul(this.x.redSub(f)).redISub(this.y);
        return this.curve.point(f, g)
      }, e.prototype.getX = function () {
        return this.x.fromRed()
      }, e.prototype.getY = function () {
        return this.y.fromRed()
      }, e.prototype.mul = function (a) {
        return a = new i(a, 16), this._hasDoubles(a) ? this.curve._fixedNafMul(
            this, a) : this.curve.endo ? this.curve._endoWnafMulAdd([this], [a])
            : this.curve._wnafMul(this, a)
      }, e.prototype.mulAdd = function (a, b, c) {
        var d = [this, b], e = [a, c];
        return this.curve.endo ? this.curve._endoWnafMulAdd(d, e)
            : this.curve._wnafMulAdd(1, d, e, 2)
      }, e.prototype.jmulAdd = function (a, b, c) {
        var d = [this, b], e = [a, c];
        return this.curve.endo ? this.curve._endoWnafMulAdd(d, e, !0)
            : this.curve._wnafMulAdd(1, d, e, 2, !0)
      }, e.prototype.eq = function (a) {
        return this === a || this.inf === a.inf && (this.inf || 0
            === this.x.cmp(a.x) && 0 === this.y.cmp(a.y))
      }, e.prototype.neg = function (a) {
        if (this.inf) {
          return this;
        }
        var b = this.curve.point(this.x, this.y.redNeg());
        if (a && this.precomputed) {
          var c = this.precomputed, d = function (a) {
            return a.neg()
          };
          b.precomputed = {
            naf: c.naf && {
              wnd: c.naf.wnd,
              points: c.naf.points.map(d)
            },
            doubles: c.doubles && {
              step: c.doubles.step,
              points: c.doubles.points.map(d)
            }
          }
        }
        return b
      }, e.prototype.toJ = function () {
        if (this.inf) {
          return this.curve.jpoint(null, null, null);
        }
        var a = this.curve.jpoint(this.x, this.y, this.curve.one);
        return a
      }, j(f, k.BasePoint), d.prototype.jpoint = function (a, b, c) {
        return new f(this, a, b, c)
      }, f.prototype.toP = function () {
        if (this.isInfinity()) {
          return this.curve.point(null, null);
        }
        var a = this.z.redInvm(), b = a.redSqr(), c = this.x.redMul(b),
            d = this.y.redMul(b).redMul(a);
        return this.curve.point(c, d)
      }, f.prototype.neg = function () {
        return this.curve.jpoint(this.x, this.y.redNeg(), this.z)
      }, f.prototype.add = function (a) {
        if (this.isInfinity()) {
          return a;
        }
        if (a.isInfinity()) {
          return this;
        }
        var b = a.z.redSqr(), c = this.z.redSqr(), d = this.x.redMul(b),
            e = a.x.redMul(c), f = this.y.redMul(b.redMul(a.z)),
            g = a.y.redMul(c.redMul(this.z)), h = d.redSub(e), i = f.redSub(g);
        if (0 === h.cmpn(0)) {
          return 0 !== i.cmpn(0) ? this.curve.jpoint(null,
              null, null) : this.dbl();
        }
        var j = h.redSqr(), k = j.redMul(h), l = d.redMul(j),
            m = i.redSqr().redIAdd(k).redISub(l).redISub(l),
            n = i.redMul(l.redISub(m)).redISub(f.redMul(k)),
            o = this.z.redMul(a.z).redMul(h);
        return this.curve.jpoint(m, n, o)
      }, f.prototype.mixedAdd = function (a) {
        if (this.isInfinity()) {
          return a.toJ();
        }
        if (a.isInfinity()) {
          return this;
        }
        var b = this.z.redSqr(), c = this.x, d = a.x.redMul(b), e = this.y,
            f = a.y.redMul(b).redMul(this.z), g = c.redSub(d), h = e.redSub(f);
        if (0 === g.cmpn(0)) {
          return 0 !== h.cmpn(0) ? this.curve.jpoint(null,
              null, null) : this.dbl();
        }
        var i = g.redSqr(), j = i.redMul(g), k = c.redMul(i),
            l = h.redSqr().redIAdd(j).redISub(k).redISub(k),
            m = h.redMul(k.redISub(l)).redISub(e.redMul(j)),
            n = this.z.redMul(g);
        return this.curve.jpoint(l, m, n)
      }, f.prototype.dblp = function (a) {
        if (0 === a) {
          return this;
        }
        if (this.isInfinity()) {
          return this;
        }
        if (!a) {
          return this.dbl();
        }
        if (this.curve.zeroA || this.curve.threeA) {
          for (var b = this, c = 0; c < a; c++) {
            b = b.dbl();
          }
          return b
        }
        for (var d = this.curve.a, e = this.curve.tinv, f = this.x, g = this.y,
            h = this.z, i = h.redSqr().redSqr(), j = g.redAdd(g), c = 0; c < a;
            c++) {
          var k = f.redSqr(), l = j.redSqr(), m = l.redSqr(),
              n = k.redAdd(k).redIAdd(k).redIAdd(d.redMul(i)), o = f.redMul(l),
              p = n.redSqr().redISub(o.redAdd(o)), q = o.redISub(p),
              r = n.redMul(q);
          r = r.redIAdd(r).redISub(m);
          var s = j.redMul(h);
          c + 1 < a && (i = i.redMul(m)), f = p, h = s, j = r
        }
        return this.curve.jpoint(f, j.redMul(e), h)
      }, f.prototype.dbl = function () {
        return this.isInfinity() ? this : this.curve.zeroA ? this._zeroDbl()
            : this.curve.threeA ? this._threeDbl() : this._dbl()
      }, f.prototype._zeroDbl = function () {
        var a, b, c;
        if (this.zOne) {
          var d = this.x.redSqr(), e = this.y.redSqr(), f = e.redSqr(),
              g = this.x.redAdd(e).redSqr().redISub(d).redISub(f);
          g = g.redIAdd(g);
          var h = d.redAdd(d).redIAdd(d), i = h.redSqr().redISub(g).redISub(g),
              j = f.redIAdd(f);
          j = j.redIAdd(j), j = j.redIAdd(j), a = i, b = h.redMul(
              g.redISub(i)).redISub(j), c = this.y.redAdd(this.y)
        } else {
          var k = this.x.redSqr(), l = this.y.redSqr(), m = l.redSqr(),
              n = this.x.redAdd(l).redSqr().redISub(k).redISub(m);
          n = n.redIAdd(n);
          var o = k.redAdd(k).redIAdd(k), p = o.redSqr(), q = m.redIAdd(m);
          q = q.redIAdd(q), q = q.redIAdd(q), a = p.redISub(n).redISub(
              n), b = o.redMul(n.redISub(a)).redISub(q), c = this.y.redMul(
              this.z), c = c.redIAdd(c)
        }
        return this.curve.jpoint(a, b, c)
      }, f.prototype._threeDbl = function () {
        var a, b, c;
        if (this.zOne) {
          var d = this.x.redSqr(), e = this.y.redSqr(), f = e.redSqr(),
              g = this.x.redAdd(e).redSqr().redISub(d).redISub(f);
          g = g.redIAdd(g);
          var h = d.redAdd(d).redIAdd(d).redIAdd(this.curve.a),
              i = h.redSqr().redISub(g).redISub(g);
          a = i;
          var j = f.redIAdd(f);
          j = j.redIAdd(j), j = j.redIAdd(j), b = h.redMul(
              g.redISub(i)).redISub(j), c = this.y.redAdd(this.y)
        } else {
          var k = this.z.redSqr(), l = this.y.redSqr(), m = this.x.redMul(l),
              n = this.x.redSub(k).redMul(this.x.redAdd(k));
          n = n.redAdd(n).redIAdd(n);
          var o = m.redIAdd(m);
          o = o.redIAdd(o);
          var p = o.redAdd(o);
          a = n.redSqr().redISub(p), c = this.y.redAdd(this.z).redSqr().redISub(
              l).redISub(k);
          var q = l.redSqr();
          q = q.redIAdd(q), q = q.redIAdd(q), q = q.redIAdd(q), b = n.redMul(
              o.redISub(a)).redISub(q)
        }
        return this.curve.jpoint(a, b, c)
      }, f.prototype._dbl = function () {
        var a = this.curve.a, b = this.x, c = this.y, d = this.z,
            e = d.redSqr().redSqr(), f = b.redSqr(), g = c.redSqr(),
            h = f.redAdd(f).redIAdd(f).redIAdd(a.redMul(e)), i = b.redAdd(b);
        i = i.redIAdd(i);
        var j = i.redMul(g), k = h.redSqr().redISub(j.redAdd(j)),
            l = j.redISub(k), m = g.redSqr();
        m = m.redIAdd(m), m = m.redIAdd(m), m = m.redIAdd(m);
        var n = h.redMul(l).redISub(m), o = c.redAdd(c).redMul(d);
        return this.curve.jpoint(k, n, o)
      }, f.prototype.trpl = function () {
        if (!this.curve.zeroA) {
          return this.dbl().add(this);
        }
        var a = this.x.redSqr(), b = this.y.redSqr(), c = this.z.redSqr(),
            d = b.redSqr(), e = a.redAdd(a).redIAdd(a), f = e.redSqr(),
            g = this.x.redAdd(b).redSqr().redISub(a).redISub(d);
        g = g.redIAdd(g), g = g.redAdd(g).redIAdd(g), g = g.redISub(f);
        var h = g.redSqr(), i = d.redIAdd(d);
        i = i.redIAdd(i), i = i.redIAdd(i), i = i.redIAdd(i);
        var j = e.redIAdd(g).redSqr().redISub(f).redISub(h).redISub(i),
            k = b.redMul(j);
        k = k.redIAdd(k), k = k.redIAdd(k);
        var l = this.x.redMul(h).redISub(k);
        l = l.redIAdd(l), l = l.redIAdd(l);
        var m = this.y.redMul(j.redMul(i.redISub(j)).redISub(g.redMul(h)));
        m = m.redIAdd(m), m = m.redIAdd(m), m = m.redIAdd(m);
        var n = this.z.redAdd(g).redSqr().redISub(c).redISub(h);
        return this.curve.jpoint(l, m, n)
      }, f.prototype.mul = function (a, b) {
        return a = new i(a, b), this.curve._wnafMul(this, a)
      }, f.prototype.eq = function (a) {
        if ("affine" === a.type) {
          return this.eq(a.toJ());
        }
        if (this === a) {
          return !0;
        }
        var b = this.z.redSqr(), c = a.z.redSqr();
        if (0 !== this.x.redMul(c).redISub(a.x.redMul(b)).cmpn(0)) {
          return !1;
        }
        var d = b.redMul(this.z), e = c.redMul(a.z);
        return 0 === this.y.redMul(e).redISub(a.y.redMul(d)).cmpn(0)
      }, f.prototype.eqXToP = function (a) {
        var b = this.z.redSqr(), c = a.toRed(this.curve.red).redMul(b);
        if (0 === this.x.cmp(c)) {
          return !0;
        }
        for (var d = a.clone(), e = this.curve.redN.redMul(b); ;) {
          if (d.iadd(this.curve.n), d.cmp(this.curve.p) >= 0) {
            return !1;
          }
          if (c.redIAdd(e), 0 === this.x.cmp(c)) {
            return !0
          }
        }
        return !1
      }, f.prototype.inspect = function () {
        return this.isInfinity() ? "<EC JPoint Infinity>" : "<EC JPoint x: "
            + this.x.toString(16, 2) + " y: " + this.y.toString(16, 2) + " z: "
            + this.z.toString(16, 2) + ">"
      }, f.prototype.isInfinity = function () {
        return 0 === this.z.cmpn(0)
      }
    }, {"../../elliptic": 1, "../curve": 4, "bn.js": 16, inherits: 27}],
    7: [function (a, b, c) {
      "use strict";

      function d(a) {
        "short" === a.type ? this.curve = new h.curve["short"](a) : "edwards"
        === a.type ? this.curve = new h.curve.edwards(a)
            : this.curve = new h.curve.mont(
                a), this.g = this.curve.g, this.n = this.curve.n, this.hash = a.hash, i(
            this.g.validate(), "Invalid curve"), i(
            this.g.mul(this.n).isInfinity(), "Invalid curve, G*N != O")
      }

      function e(a, b) {
        Object.defineProperty(f, a, {
          configurable: !0, enumerable: !0, get: function () {
            var c = new d(b);
            return Object.defineProperty(f, a,
                {configurable: !0, enumerable: !0, value: c}), c
          }
        })
      }

      var f = c, g = a("hash.js"), h = a("../elliptic"), i = h.utils.assert;
      f.PresetCurve = d, e("p192", {
        type: "short",
        prime: "p192",
        p: "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff",
        a: "ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc",
        b: "64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1",
        n: "ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831",
        hash: g.sha256,
        gRed: !1,
        g: ["188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012",
          "07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811"]
      }), e("p224", {
        type: "short",
        prime: "p224",
        p: "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001",
        a: "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe",
        b: "b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4",
        n: "ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d",
        hash: g.sha256,
        gRed: !1,
        g: ["b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21",
          "bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34"]
      }), e("p256", {
        type: "short",
        prime: null,
        p: "ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff",
        a: "ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc",
        b: "5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b",
        n: "ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551",
        hash: g.sha256,
        gRed: !1,
        g: ["6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296",
          "4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5"]
      }), e("p384", {
        type: "short",
        prime: null,
        p: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 ffffffff",
        a: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 fffffffc",
        b: "b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f 5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef",
        n: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 f4372ddf 581a0db2 48b0a77a ecec196a ccc52973",
        hash: g.sha384,
        gRed: !1,
        g: ["aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 5502f25d bf55296c 3a545e38 72760ab7",
          "3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 0a60b1ce 1d7e819d 7a431d7c 90ea0e5f"]
      }), e("p521", {
        type: "short",
        prime: null,
        p: "000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff",
        a: "000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffc",
        b: "00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b 99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd 3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00",
        n: "000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409",
        hash: g.sha512,
        gRed: !1,
        g: ["000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66",
          "00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 3fad0761 353c7086 a272c240 88be9476 9fd16650"]
      }), e("curve25519", {
        type: "mont",
        prime: "p25519",
        p: "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",
        a: "76d06",
        b: "1",
        n: "1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed",
        hash: g.sha256,
        gRed: !1,
        g: ["9"]
      }), e("ed25519", {
        type: "edwards",
        prime: "p25519",
        p: "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",
        a: "-1",
        c: "1",
        d: "52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3",
        n: "1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed",
        hash: g.sha256,
        gRed: !1,
        g: ["216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a",
          "6666666666666666666666666666666666666666666666666666666666666658"]
      });
      var j;
      try {
        j = a("./precomputed/secp256k1")
      } catch (k) {
        j = void 0
      }
      e("secp256k1", {
        type: "short",
        prime: "k256",
        p: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f",
        a: "0",
        b: "7",
        n: "ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141",
        h: "1",
        hash: g.sha256,
        beta: "7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee",
        lambda: "5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72",
        basis: [{
          a: "3086d221a7d46bcde86c90e49284eb15",
          b: "-e4437ed6010e88286f547fa90abfe4c3"
        }, {
          a: "114ca50f7a8e2f3f657c1108d9d44cfd8",
          b: "3086d221a7d46bcde86c90e49284eb15"
        }],
        gRed: !1,
        g: ["79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
          "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8", j]
      })
    }, {"../elliptic": 1, "./precomputed/secp256k1": 14, "hash.js": 19}],
    8: [function (a, b, c) {
      "use strict";

      function d(a) {
        return this instanceof d ? ("string" == typeof a && (i(
            g.curves.hasOwnProperty(a), "Unknown curve "
            + a), a = g.curves[a]), a instanceof g.curves.PresetCurve
        && (a = {curve: a}), this.curve = a.curve.curve, this.n = this.curve.n, this.nh = this.n.ushrn(
            1), this.g = this.curve.g, this.g = a.curve.g, this.g.precompute(a.curve.n.bitLength()
            + 1), void (this.hash = a.hash || a.curve.hash)) : new d(a)
      }

      var e = a("bn.js"), f = a("hmac-drbg"), g = a("../../elliptic"),
          h = g.utils, i = h.assert, j = a("./key"), k = a("./signature");
      b.exports = d, d.prototype.keyPair = function (a) {
        return new j(this, a)
      }, d.prototype.keyFromPrivate = function (a, b) {
        return j.fromPrivate(this, a, b)
      }, d.prototype.keyFromPublic = function (a, b) {
        return j.fromPublic(this, a, b)
      }, d.prototype.genKeyPair = function (a) {
        a || (a = {});
        for (var b = new f({
          hash: this.hash,
          pers: a.pers,
          persEnc: a.persEnc || "utf8",
          entropy: a.entropy || g.rand(this.hash.hmacStrength),
          entropyEnc: a.entropy && a.entropyEnc || "utf8",
          nonce: this.n.toArray()
        }), c = this.n.byteLength(), d = this.n.sub(new e(2)); ;) {
          var h = new e(b.generate(c));
          if (!(h.cmp(d) > 0)) {
            return h.iaddn(1), this.keyFromPrivate(h)
          }
        }
      }, d.prototype._truncateToN = function (a, b) {
        var c = 8 * a.byteLength() - this.n.bitLength();
        return c > 0 && (a = a.ushrn(c)), !b && a.cmp(this.n) >= 0 ? a.sub(
            this.n) : a
      }, d.prototype.sign = function (a, b, c, d) {
        "object" == typeof c && (d = c, c = null), d
        || (d = {}), b = this.keyFromPrivate(b, c), a = this._truncateToN(
            new e(a, 16));
        for (var g = this.n.byteLength(), h = b.getPrivate().toArray("be", g),
            i = a.toArray("be", g), j = new f({
              hash: this.hash,
              entropy: h,
              nonce: i,
              pers: d.pers,
              persEnc: d.persEnc || "utf8"
            }), l = this.n.sub(new e(1)), m = 0; !0; m++) {
          var n = d.k ? d.k(m) : new e(j.generate(this.n.byteLength()));
          if (n = this._truncateToN(n, !0), !(n.cmpn(1) <= 0 || n.cmp(l)
                  >= 0)) {
            var o = this.g.mul(n);
            if (!o.isInfinity()) {
              var p = o.getX(), q = p.umod(this.n);
              if (0 !== q.cmpn(0)) {
                var r = n.invm(this.n).mul(q.mul(b.getPrivate()).iadd(a));
                if (r = r.umod(this.n), 0 !== r.cmpn(0)) {
                  var s = (o.getY().isOdd() ? 1 : 0) | (0 !== p.cmp(q) ? 2 : 0);
                  return d.canonical && r.cmp(this.nh) > 0 && (r = this.n.sub(
                      r), s ^= 1), new k({r: q, s: r, recoveryParam: s})
                }
              }
            }
          }
        }
      }, d.prototype.verify = function (a, b, c, d) {
        a = this._truncateToN(new e(a, 16)), c = this.keyFromPublic(c,
            d), b = new k(b, "hex");
        var f = b.r, g = b.s;
        if (f.cmpn(1) < 0 || f.cmp(this.n) >= 0) {
          return !1;
        }
        if (g.cmpn(1) < 0 || g.cmp(this.n) >= 0) {
          return !1;
        }
        var h = g.invm(this.n), i = h.mul(a).umod(this.n),
            j = h.mul(f).umod(this.n);
        if (!this.curve._maxwellTrick) {
          var l = this.g.mulAdd(i, c.getPublic(), j);
          return !l.isInfinity() && 0 === l.getX().umod(this.n).cmp(f)
        }
        var l = this.g.jmulAdd(i, c.getPublic(), j);
        return !l.isInfinity() && l.eqXToP(f)
      }, d.prototype.recoverPubKey = function (a, b, c, d) {
        i((3 & c) === c, "The recovery param is more than two bits"), b = new k(
            b, d);
        var f = this.n, g = new e(a), h = b.r, j = b.s, l = 1 & c, m = c >> 1;
        if (h.cmp(this.curve.p.umod(this.curve.n)) >= 0 && m) {
          throw new Error(
              "Unable to find sencond key candinate");
        }
        h = m ? this.curve.pointFromX(h.add(this.curve.n), l)
            : this.curve.pointFromX(h, l);
        var n = b.r.invm(f), o = f.sub(g).mul(n).umod(f), p = j.mul(n).umod(f);
        return this.g.mulAdd(o, h, p)
      }, d.prototype.getKeyRecoveryParam = function (a, b, c, d) {
        if (b = new k(b, d), null !== b.recoveryParam) {
          return b.recoveryParam;
        }
        for (var e = 0; e < 4; e++) {
          var f;
          try {
            f = this.recoverPubKey(a, b, e)
          } catch (a) {
            continue
          }
          if (f.eq(c)) {
            return e
          }
        }
        throw new Error("Unable to find valid recovery factor")
      }
    }, {
      "../../elliptic": 1,
      "./key": 9,
      "./signature": 10,
      "bn.js": 16,
      "hmac-drbg": 25
    }],
    9: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        this.ec = a, this.priv = null, this.pub = null, b.priv
        && this._importPrivate(b.priv, b.privEnc), b.pub && this._importPublic(
            b.pub, b.pubEnc)
      }

      var e = a("bn.js"), f = a("../../elliptic"), g = f.utils, h = g.assert;
      b.exports = d, d.fromPublic = function (a, b, c) {
        return b instanceof d ? b : new d(a, {pub: b, pubEnc: c})
      }, d.fromPrivate = function (a, b, c) {
        return b instanceof d ? b : new d(a, {priv: b, privEnc: c})
      }, d.prototype.validate = function () {
        var a = this.getPublic();
        return a.isInfinity() ? {result: !1, reason: "Invalid public key"}
            : a.validate() ? a.mul(this.ec.curve.n).isInfinity() ? {
              result: !0,
              reason: null
            } : {result: !1, reason: "Public key * N != O"} : {
              result: !1,
              reason: "Public key is not a point"
            }
      }, d.prototype.getPublic = function (a, b) {
        return "string" == typeof a && (b = a, a = null), this.pub
        || (this.pub = this.ec.g.mul(this.priv)), b ? this.pub.encode(b, a)
            : this.pub
      }, d.prototype.getPrivate = function (a) {
        return "hex" === a ? this.priv.toString(16, 2) : this.priv
      }, d.prototype._importPrivate = function (a, b) {
        this.priv = new e(a, b || 16), this.priv = this.priv.umod(
            this.ec.curve.n)
      }, d.prototype._importPublic = function (a, b) {
        return a.x || a.y ? ("mont" === this.ec.curve.type ? h(a.x,
            "Need x coordinate") : "short" !== this.ec.curve.type && "edwards"
            !== this.ec.curve.type || h(a.x && a.y,
                "Need both x and y coordinate"), void (this.pub = this.ec.curve.point(
            a.x, a.y))) : void (this.pub = this.ec.curve.decodePoint(a, b))
      }, d.prototype.derive = function (a) {
        return a.mul(this.priv).getX()
      }, d.prototype.sign = function (a, b, c) {
        return this.ec.sign(a, this, b, c)
      }, d.prototype.verify = function (a, b) {
        return this.ec.verify(a, b, this)
      }, d.prototype.inspect = function () {
        return "<Key priv: " + (this.priv && this.priv.toString(16, 2))
            + " pub: " + (this.pub && this.pub.inspect()) + " >"
      }
    }, {"../../elliptic": 1, "bn.js": 16}],
    10: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        return a instanceof d ? a : void (this._importDER(a, b) || (l(a.r
            && a.s,
            "Signature without r or s"), this.r = new i(a.r,
            16), this.s = new i(a.s, 16), void 0 === a.recoveryParam
            ? this.recoveryParam = null : this.recoveryParam = a.recoveryParam))
      }

      function e() {
        this.place = 0
      }

      function f(a, b) {
        var c = a[b.place++];
        if (!(128 & c)) {
          return c;
        }
        for (var d = 15 & c, e = 0, f = 0, g = b.place; f < d;
            f++ , g++) {
          e <<= 8, e |= a[g];
        }
        return b.place = g, e
      }

      function g(a) {
        for (var b = 0, c = a.length - 1;
            !a[b] && !(128 & a[b + 1]) && b < c;) {
          b++;
        }
        return 0 === b ? a : a.slice(b)
      }

      function h(a, b) {
        if (b < 128) {
          return void a.push(b);
        }
        var c = 1 + (Math.log(b) / Math.LN2 >>> 3);
        for (a.push(128 | c); --c;) {
          a.push(b >>> (c << 3) & 255);
        }
        a.push(b)
      }

      var i = a("bn.js"), j = a("../../elliptic"), k = j.utils, l = k.assert;
      b.exports = d, d.prototype._importDER = function (a, b) {
        a = k.toArray(a, b);
        var c = new e;
        if (48 !== a[c.place++]) {
          return !1;
        }
        var d = f(a, c);
        if (d + c.place !== a.length) {
          return !1;
        }
        if (2 !== a[c.place++]) {
          return !1;
        }
        var g = f(a, c), h = a.slice(c.place, g + c.place);
        if (c.place += g, 2 !== a[c.place++]) {
          return !1;
        }
        var j = f(a, c);
        if (a.length !== j + c.place) {
          return !1;
        }
        var l = a.slice(c.place, j + c.place);
        return 0 === h[0] && 128 & h[1] && (h = h.slice(1)), 0 === l[0] && 128
        & l[1] && (l = l.slice(1)), this.r = new i(h), this.s = new i(
            l), this.recoveryParam = null, !0
      }, d.prototype.toDER = function (a) {
        var b = this.r.toArray(), c = this.s.toArray();
        for (128 & b[0] && (b = [0].concat(b)), 128 & c[0] && (c = [0].concat(
            c)), b = g(b), c = g(c); !(c[0] || 128 & c[1]);) {
          c = c.slice(1);
        }
        var d = [2];
        h(d, b.length), d = d.concat(b), d.push(2), h(d, c.length);
        var e = d.concat(c), f = [48];
        return h(f, e.length), f = f.concat(e), k.encode(f, a)
      }
    }, {"../../elliptic": 1, "bn.js": 16}],
    11: [function (a, b, c) {
      "use strict";

      function d(a) {
        if (h("ed25519" === a, "only tested with ed25519 so far"), !(this
                instanceof d)) {
          return new d(a);
        }
        var a = f.curves[a].curve;
        this.curve = a, this.g = a.g, this.g.precompute(a.n.bitLength()
            + 1), this.pointClass = a.point().constructor, this.encodingLength = Math.ceil(a.n.bitLength()
            / 8), this.hash = e.sha512
      }

      var e = a("hash.js"), f = a("../../elliptic"), g = f.utils, h = g.assert,
          i = g.parseBytes, j = a("./key"), k = a("./signature");
      b.exports = d, d.prototype.sign = function (a, b) {
        a = i(a);
        var c = this.keyFromSecret(b), d = this.hashInt(c.messagePrefix(), a),
            e = this.g.mul(d), f = this.encodePoint(e),
            g = this.hashInt(f, c.pubBytes(), a).mul(c.priv()),
            h = d.add(g).umod(this.curve.n);
        return this.makeSignature({R: e, S: h, Rencoded: f})
      }, d.prototype.verify = function (a, b, c) {
        a = i(a), b = this.makeSignature(b);
        var d = this.keyFromPublic(c),
            e = this.hashInt(b.Rencoded(), d.pubBytes(), a),
            f = this.g.mul(b.S()), g = b.R().add(d.pub().mul(e));
        return g.eq(f)
      }, d.prototype.hashInt = function () {
        for (var a = this.hash(), b = 0; b < arguments.length; b++) {
          a.update(
              arguments[b]);
        }
        return g.intFromLE(a.digest()).umod(this.curve.n)
      }, d.prototype.keyFromPublic = function (a) {
        return j.fromPublic(this, a)
      }, d.prototype.keyFromSecret = function (a) {
        return j.fromSecret(this, a)
      }, d.prototype.makeSignature = function (a) {
        return a instanceof k ? a : new k(this, a)
      }, d.prototype.encodePoint = function (a) {
        var b = a.getY().toArray("le", this.encodingLength);
        return b[this.encodingLength - 1] |= a.getX().isOdd() ? 128 : 0, b
      }, d.prototype.decodePoint = function (a) {
        a = g.parseBytes(a);
        var b = a.length - 1, c = a.slice(0, b).concat(a[b] & -129),
            d = 0 !== (128 & a[b]), e = g.intFromLE(c);
        return this.curve.pointFromY(e, d)
      }, d.prototype.encodeInt = function (a) {
        return a.toArray("le", this.encodingLength)
      }, d.prototype.decodeInt = function (a) {
        return g.intFromLE(a)
      }, d.prototype.isPoint = function (a) {
        return a instanceof this.pointClass
      }
    }, {"../../elliptic": 1, "./key": 12, "./signature": 13, "hash.js": 19}],
    12: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        this.eddsa = a, this._secret = h(b.secret), a.isPoint(b.pub)
            ? this._pub = b.pub : this._pubBytes = h(b.pub)
      }

      var e = a("../../elliptic"), f = e.utils, g = f.assert, h = f.parseBytes,
          i = f.cachedProperty;
      d.fromPublic = function (a, b) {
        return b instanceof d ? b : new d(a, {pub: b})
      }, d.fromSecret = function (a, b) {
        return b instanceof d ? b : new d(a, {secret: b})
      }, d.prototype.secret = function () {
        return this._secret
      }, i(d, "pubBytes", function () {
        return this.eddsa.encodePoint(this.pub())
      }), i(d, "pub", function () {
        return this._pubBytes ? this.eddsa.decodePoint(this._pubBytes)
            : this.eddsa.g.mul(this.priv())
      }), i(d, "privBytes", function () {
        var a = this.eddsa, b = this.hash(), c = a.encodingLength - 1,
            d = b.slice(0, a.encodingLength);
        return d[0] &= 248, d[c] &= 127, d[c] |= 64, d
      }), i(d, "priv", function () {
        return this.eddsa.decodeInt(this.privBytes())
      }), i(d, "hash", function () {
        return this.eddsa.hash().update(this.secret()).digest()
      }), i(d, "messagePrefix", function () {
        return this.hash().slice(this.eddsa.encodingLength)
      }), d.prototype.sign = function (a) {
        return g(this._secret, "KeyPair can only verify"), this.eddsa.sign(a,
            this)
      }, d.prototype.verify = function (a, b) {
        return this.eddsa.verify(a, b, this)
      }, d.prototype.getSecret = function (a) {
        return g(this._secret, "KeyPair is public only"), f.encode(
            this.secret(), a)
      }, d.prototype.getPublic = function (a) {
        return f.encode(this.pubBytes(), a)
      }, b.exports = d
    }, {"../../elliptic": 1}],
    13: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        this.eddsa = a, "object" != typeof b && (b = j(b)), Array.isArray(b)
        && (b = {
          R: b.slice(0, a.encodingLength),
          S: b.slice(a.encodingLength)
        }), h(b.R && b.S, "Signature without R or S"), a.isPoint(b.R)
        && (this._R = b.R), b.S instanceof e
        && (this._S = b.S), this._Rencoded = Array.isArray(b.R) ? b.R
            : b.Rencoded, this._Sencoded = Array.isArray(b.S) ? b.S : b.Sencoded
      }

      var e = a("bn.js"), f = a("../../elliptic"), g = f.utils, h = g.assert,
          i = g.cachedProperty, j = g.parseBytes;
      i(d, "S", function () {
        return this.eddsa.decodeInt(this.Sencoded())
      }), i(d, "R", function () {
        return this.eddsa.decodePoint(this.Rencoded())
      }), i(d, "Rencoded", function () {
        return this.eddsa.encodePoint(this.R())
      }), i(d, "Sencoded", function () {
        return this.eddsa.encodeInt(this.S())
      }), d.prototype.toBytes = function () {
        return this.Rencoded().concat(this.Sencoded())
      }, d.prototype.toHex = function () {
        return g.encode(this.toBytes(), "hex").toUpperCase()
      }, b.exports = d
    }, {"../../elliptic": 1, "bn.js": 16}],
    14: [function (a, b, c) {
      b.exports = {
        doubles: {
          step: 4,
          points: [["e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a",
            "f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821"],
            ["8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508",
              "11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf"],
            ["175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739",
              "d3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695"],
            ["363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640",
              "4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9"],
            ["8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c",
              "4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36"],
            ["723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda",
              "96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f"],
            ["eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa",
              "5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999"],
            ["100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0",
              "cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09"],
            ["e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d",
              "9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d"],
            ["feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d",
              "e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088"],
            ["da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1",
              "9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d"],
            ["53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0",
              "5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8"],
            ["8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047",
              "10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a"],
            ["385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862",
              "283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453"],
            ["6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7",
              "7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160"],
            ["3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd",
              "56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0"],
            ["85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83",
              "7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6"],
            ["948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a",
              "53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589"],
            ["6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8",
              "bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17"],
            ["e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d",
              "4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda"],
            ["e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725",
              "7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd"],
            ["213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754",
              "4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2"],
            ["4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c",
              "17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6"],
            ["fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6",
              "6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f"],
            ["76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39",
              "c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01"],
            ["c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891",
              "893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3"],
            ["d895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b",
              "febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f"],
            ["b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03",
              "2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7"],
            ["e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d",
              "eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78"],
            ["a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070",
              "7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1"],
            ["90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4",
              "e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150"],
            ["8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da",
              "662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82"],
            ["e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11",
              "1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc"],
            ["8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e",
              "efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b"],
            ["e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41",
              "2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51"],
            ["b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef",
              "67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45"],
            ["d68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8",
              "db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120"],
            ["324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d",
              "648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84"],
            ["4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96",
              "35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d"],
            ["9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd",
              "ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d"],
            ["6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5",
              "9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8"],
            ["a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266",
              "40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8"],
            ["7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71",
              "34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac"],
            ["928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac",
              "c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f"],
            ["85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751",
              "1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962"],
            ["ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e",
              "493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907"],
            ["827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241",
              "c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec"],
            ["eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3",
              "be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d"],
            ["e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f",
              "4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414"],
            ["1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19",
              "aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd"],
            ["146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be",
              "b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0"],
            ["fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9",
              "6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811"],
            ["da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2",
              "8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1"],
            ["a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13",
              "7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c"],
            ["174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c",
              "ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73"],
            ["959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba",
              "2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd"],
            ["d2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151",
              "e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405"],
            ["64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073",
              "d99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589"],
            ["8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458",
              "38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e"],
            ["13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b",
              "69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27"],
            ["bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366",
              "d3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1"],
            ["8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa",
              "40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482"],
            ["8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0",
              "620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945"],
            ["dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787",
              "7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573"],
            ["f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e",
              "ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82"]]
        }, naf: {
          wnd: 7,
          points: [["f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9",
            "388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672"],
            ["2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4",
              "d8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6"],
            ["5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc",
              "6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da"],
            ["acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe",
              "cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37"],
            ["774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb",
              "d984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b"],
            ["f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8",
              "ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81"],
            ["d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e",
              "581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58"],
            ["defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34",
              "4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77"],
            ["2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c",
              "85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a"],
            ["352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5",
              "321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c"],
            ["2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f",
              "2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67"],
            ["9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714",
              "73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402"],
            ["daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729",
              "a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55"],
            ["c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db",
              "2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482"],
            ["6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4",
              "e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82"],
            ["1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5",
              "b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396"],
            ["605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479",
              "2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49"],
            ["62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d",
              "80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf"],
            ["80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f",
              "1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a"],
            ["7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb",
              "d0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7"],
            ["d528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9",
              "eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933"],
            ["49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963",
              "758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a"],
            ["77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74",
              "958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6"],
            ["f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530",
              "e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37"],
            ["463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b",
              "5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e"],
            ["f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247",
              "cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6"],
            ["caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1",
              "cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476"],
            ["2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120",
              "4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40"],
            ["7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435",
              "91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61"],
            ["754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18",
              "673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683"],
            ["e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8",
              "59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5"],
            ["186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb",
              "3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b"],
            ["df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f",
              "55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417"],
            ["5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143",
              "efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868"],
            ["290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba",
              "e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a"],
            ["af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45",
              "f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6"],
            ["766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a",
              "744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996"],
            ["59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e",
              "c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e"],
            ["f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8",
              "e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d"],
            ["7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c",
              "30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2"],
            ["948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519",
              "e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e"],
            ["7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab",
              "100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437"],
            ["3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca",
              "ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311"],
            ["d3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf",
              "8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4"],
            ["1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610",
              "68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575"],
            ["733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4",
              "f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d"],
            ["15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c",
              "d56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d"],
            ["a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940",
              "edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629"],
            ["e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980",
              "a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06"],
            ["311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3",
              "66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374"],
            ["34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf",
              "9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee"],
            ["f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63",
              "4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1"],
            ["d7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448",
              "fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b"],
            ["32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf",
              "5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661"],
            ["7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5",
              "8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6"],
            ["ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6",
              "8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e"],
            ["16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5",
              "5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d"],
            ["eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99",
              "f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc"],
            ["78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51",
              "f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4"],
            ["494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5",
              "42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c"],
            ["a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5",
              "204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b"],
            ["c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997",
              "4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913"],
            ["841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881",
              "73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154"],
            ["5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5",
              "39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865"],
            ["36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66",
              "d2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc"],
            ["336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726",
              "ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224"],
            ["8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede",
              "6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e"],
            ["1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94",
              "60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6"],
            ["85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31",
              "3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511"],
            ["29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51",
              "b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b"],
            ["a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252",
              "ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2"],
            ["4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5",
              "cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c"],
            ["d24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b",
              "6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3"],
            ["ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4",
              "322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d"],
            ["af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f",
              "6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700"],
            ["e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889",
              "2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4"],
            ["591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246",
              "b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196"],
            ["11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984",
              "998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4"],
            ["3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a",
              "b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257"],
            ["cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030",
              "bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13"],
            ["c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197",
              "6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096"],
            ["c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593",
              "c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38"],
            ["a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef",
              "21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f"],
            ["347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38",
              "60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448"],
            ["da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a",
              "49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a"],
            ["c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111",
              "5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4"],
            ["4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502",
              "7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437"],
            ["3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea",
              "be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7"],
            ["cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26",
              "8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d"],
            ["b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986",
              "39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a"],
            ["d4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e",
              "62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54"],
            ["48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4",
              "25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77"],
            ["dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda",
              "ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517"],
            ["6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859",
              "cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10"],
            ["e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f",
              "f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125"],
            ["eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c",
              "6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e"],
            ["13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942",
              "fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1"],
            ["ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a",
              "1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2"],
            ["b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80",
              "5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423"],
            ["ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d",
              "438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8"],
            ["8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1",
              "cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758"],
            ["52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63",
              "c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375"],
            ["e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352",
              "6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d"],
            ["7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193",
              "ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec"],
            ["5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00",
              "9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0"],
            ["32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58",
              "ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c"],
            ["e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7",
              "d3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4"],
            ["8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8",
              "c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f"],
            ["4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e",
              "67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649"],
            ["3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d",
              "cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826"],
            ["674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b",
              "299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5"],
            ["d32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f",
              "f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87"],
            ["30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6",
              "462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b"],
            ["be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297",
              "62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc"],
            ["93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a",
              "7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c"],
            ["b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c",
              "ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f"],
            ["d5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52",
              "4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a"],
            ["d3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb",
              "bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46"],
            ["463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065",
              "bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f"],
            ["7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917",
              "603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03"],
            ["74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9",
              "cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08"],
            ["30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3",
              "553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8"],
            ["9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57",
              "712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373"],
            ["176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66",
              "ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3"],
            ["75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8",
              "9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8"],
            ["809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721",
              "9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1"],
            ["1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180",
              "4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9"]]
        }
      }
    }, {}],
    15: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        for (var c = [], d = 1 << b + 1, e = a.clone(); e.cmpn(1) >= 0;) {
          var f;
          if (e.isOdd()) {
            var g = e.andln(d - 1);
            f = g > (d >> 1) - 1 ? (d >> 1) - g : g, e.isubn(f)
          } else {
            f = 0;
          }
          c.push(f);
          for (var h = 0 !== e.cmpn(0) && 0 === e.andln(d - 1) ? b + 1 : 1,
              i = 1; i < h; i++) {
            c.push(0);
          }
          e.iushrn(h)
        }
        return c
      }

      function e(a, b) {
        var c = [[], []];
        a = a.clone(), b = b.clone();
        for (var d = 0, e = 0; a.cmpn(-d) > 0 || b.cmpn(-e) > 0;) {
          var f = a.andln(3) + d & 3, g = b.andln(3) + e & 3;
          3 === f && (f = -1), 3 === g && (g = -1);
          var h;
          if (0 === (1 & f)) {
            h = 0;
          } else {
            var i = a.andln(7) + d & 7;
            h = 3 !== i && 5 !== i || 2 !== g ? f : -f
          }
          c[0].push(h);
          var j;
          if (0 === (1 & g)) {
            j = 0;
          } else {
            var i = b.andln(7) + e & 7;
            j = 3 !== i && 5 !== i || 2 !== f ? g : -g
          }
          c[1].push(j), 2 * d === h + 1 && (d = 1 - d), 2 * e === j + 1
          && (e = 1 - e), a.iushrn(1), b.iushrn(1)
        }
        return c
      }

      function f(a, b, c) {
        var d = "_" + b;
        a.prototype[b] = function () {
          return void 0 !== this[d] ? this[d] : this[d] = c.call(this)
        }
      }

      function g(a) {
        return "string" == typeof a ? i.toArray(a, "hex") : a
      }

      function h(a) {
        return new j(a, "hex", "le")
      }

      var i = c, j = a("bn.js"), k = a("minimalistic-assert"),
          l = a("minimalistic-crypto-utils");
      i.assert = k, i.toArray = l.toArray, i.zero2 = l.zero2, i.toHex = l.toHex, i.encode = l.encode, i.getNAF = d, i.getJSF = e, i.cachedProperty = f, i.parseBytes = g, i.intFromLE = h
    }, {
      "bn.js": 16,
      "minimalistic-assert": 28,
      "minimalistic-crypto-utils": 29
    }],
    16: [function (a, b, c) {
      !function (b, c) {
        "use strict";

        function d(a, b) {
          if (!a) {
            throw new Error(b || "Assertion failed")
          }
        }

        function e(a, b) {
          a.super_ = b;
          var c = function () {
          };
          c.prototype = b.prototype, a.prototype = new c, a.prototype.constructor = a
        }

        function f(a, b, c) {
          return f.isBN(a) ? a
              : (this.negative = 0, this.words = null, this.length = 0, this.red = null, void (null
                  !== a && ("le" !== b && "be" !== b
                  || (c = b, b = 10), this._init(a || 0, b || 10, c || "be"))))
        }

        function g(a, b, c) {
          for (var d = 0, e = Math.min(a.length, c), f = b; f < e; f++) {
            var g = a.charCodeAt(f) - 48;
            d <<= 4, d |= g >= 49 && g <= 54 ? g - 49 + 10 : g >= 17 && g <= 22
                ? g - 17 + 10 : 15 & g
          }
          return d
        }

        function h(a, b, c, d) {
          for (var e = 0, f = Math.min(a.length, c), g = b; g < f; g++) {
            var h = a.charCodeAt(g) - 48;
            e *= d, e += h >= 49 ? h - 49 + 10 : h >= 17 ? h - 17 + 10 : h
          }
          return e
        }

        function i(a) {
          for (var b = new Array(a.bitLength()), c = 0; c < b.length; c++) {
            var d = c / 26 | 0, e = c % 26;
            b[c] = (a.words[d] & 1 << e) >>> e
          }
          return b
        }

        function j(a, b, c) {
          c.negative = b.negative ^ a.negative;
          var d = a.length + b.length | 0;
          c.length = d, d = d - 1 | 0;
          var e = 0 | a.words[0], f = 0 | b.words[0], g = e * f,
              h = 67108863 & g, i = g / 67108864 | 0;
          c.words[0] = h;
          for (var j = 1; j < d; j++) {
            for (var k = i >>> 26, l = 67108863 & i,
                m = Math.min(j, b.length - 1),
                n = Math.max(0, j - a.length + 1); n <= m; n++) {
              var o = j - n | 0;
              e = 0 | a.words[o], f = 0 | b.words[n], g = e * f + l, k += g
                  / 67108864 | 0, l = 67108863 & g
            }
            c.words[j] = 0 | l, i = 0 | k
          }
          return 0 !== i ? c.words[j] = 0 | i : c.length-- , c.strip()
        }

        function k(a, b, c) {
          c.negative = b.negative ^ a.negative, c.length = a.length + b.length;
          for (var d = 0, e = 0, f = 0; f < c.length - 1; f++) {
            var g = e;
            e = 0;
            for (var h = 67108863 & d, i = Math.min(f, b.length - 1),
                j = Math.max(0, f - a.length + 1); j <= i; j++) {
              var k = f - j, l = 0 | a.words[k], m = 0 | b.words[j], n = l * m,
                  o = 67108863 & n;
              g = g + (n / 67108864 | 0) | 0, o = o + h | 0, h = 67108863
                  & o, g = g + (o >>> 26) | 0, e += g >>> 26, g &= 67108863
            }
            c.words[f] = h, d = g, g = e
          }
          return 0 !== d ? c.words[f] = d : c.length-- , c.strip()
        }

        function l(a, b, c) {
          var d = new m;
          return d.mulp(a, b, c)
        }

        function m(a, b) {
          this.x = a, this.y = b
        }

        function n(a, b) {
          this.name = a, this.p = new f(b,
              16), this.n = this.p.bitLength(), this.k = new f(1).iushln(
              this.n).isub(this.p), this.tmp = this._tmp()
        }

        function o() {
          n.call(this, "k256",
              "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f")
        }

        function p() {
          n.call(this, "p224",
              "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001")
        }

        function q() {
          n.call(this, "p192",
              "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff")
        }

        function r() {
          n.call(this, "25519",
              "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed")
        }

        function s(a) {
          if ("string" == typeof a) {
            var b = f._prime(a);
            this.m = b.p, this.prime = b
          } else {
            d(a.gtn(1),
                "modulus must be greater than 1"), this.m = a, this.prime = null
          }
        }

        function t(a) {
          s.call(this, a), this.shift = this.m.bitLength(), this.shift % 26
          !== 0 && (this.shift += 26 - this.shift % 26), this.r = new f(
              1).iushln(this.shift), this.r2 = this.imod(
              this.r.sqr()), this.rinv = this.r._invmp(
              this.m), this.minv = this.rinv.mul(this.r).isubn(1).div(
              this.m), this.minv = this.minv.umod(
              this.r), this.minv = this.r.sub(this.minv)
        }

        "object" == typeof b ? b.exports = f
            : c.BN = f, f.BN = f, f.wordSize = 26;
        var u;
        try {
          u = a("buffer").Buffer
        } catch (v) {
        }
        f.isBN = function (a) {
          return a instanceof f || null !== a && "object" == typeof a
              && a.constructor.wordSize === f.wordSize && Array.isArray(a.words)
        }, f.max = function (a, b) {
          return a.cmp(b) > 0 ? a : b
        }, f.min = function (a, b) {
          return a.cmp(b) < 0 ? a : b
        }, f.prototype._init = function (a, b, c) {
          if ("number" == typeof a) {
            return this._initNumber(a, b, c);
          }
          if ("object" == typeof a) {
            return this._initArray(a, b, c);
          }
          "hex" === b && (b = 16), d(b === (0 | b) && b >= 2 && b
              <= 36), a = a.toString().replace(/\s+/g, "");
          var e = 0;
          "-" === a[0] && e++ , 16 === b ? this._parseHex(a, e)
              : this._parseBase(a, b, e), "-" === a[0]
          && (this.negative = 1), this.strip(), "le" === c && this._initArray(
              this.toArray(), b, c)
        }, f.prototype._initNumber = function (a, b, c) {
          a < 0 && (this.negative = 1, a = -a), a < 67108864
              ? (this.words = [67108863 & a], this.length = 1) : a
              < 4503599627370496 ? (this.words = [67108863 & a,
                a / 67108864 & 67108863], this.length = 2) : (d(a
                  < 9007199254740992), this.words = [67108863 & a,
                a / 67108864 & 67108863, 1], this.length = 3), "le" === c
          && this._initArray(this.toArray(), b, c)
        }, f.prototype._initArray = function (a, b, c) {
          if (d("number" == typeof a.length), a.length
              <= 0) {
            return this.words = [0], this.length = 1, this;
          }
          this.length = Math.ceil(a.length / 3), this.words = new Array(
              this.length);
          for (var e = 0; e < this.length; e++) {
            this.words[e] = 0;
          }
          var f, g, h = 0;
          if ("be" === c) {
            for (e = a.length - 1, f = 0; e >= 0; e -= 3) {
              g = a[e]
                  | a[e - 1] << 8 | a[e - 2] << 16, this.words[f] |= g << h
                  & 67108863, this.words[f + 1] = g >>> 26 - h
                  & 67108863, h += 24, h >= 26 && (h -= 26, f++);
            }
          } else if ("le"
              === c) {
            for (e = 0, f = 0; e < a.length; e += 3) {
              g = a[e] | a[e
              + 1] << 8 | a[e + 2] << 16, this.words[f] |= g << h
                  & 67108863, this.words[f + 1] = g >>> 26 - h
                  & 67108863, h += 24, h >= 26 && (h -= 26, f++);
            }
          }
          return this.strip()
        }, f.prototype._parseHex = function (a, b) {
          this.length = Math.ceil((a.length - b) / 6), this.words = new Array(
              this.length);
          for (var c = 0; c < this.length; c++) {
            this.words[c] = 0;
          }
          var d, e, f = 0;
          for (c = a.length - 6, d = 0; c >= b; c -= 6) {
            e = g(a, c, c
                + 6), this.words[d] |= e << f & 67108863, this.words[d + 1] |= e
                >>> 26 - f & 4194303, f += 24, f >= 26 && (f -= 26, d++);
          }
          c + 6 !== b && (e = g(a, b, c + 6), this.words[d] |= e << f
              & 67108863, this.words[d + 1] |= e >>> 26 - f
              & 4194303), this.strip()
        }, f.prototype._parseBase = function (a, b, c) {
          this.words = [0], this.length = 1;
          for (var d = 0, e = 1; e <= 67108863; e *= b) {
            d++;
          }
          d-- , e = e / b | 0;
          for (var f = a.length - c, g = f % d, i = Math.min(f, f - g) + c,
              j = 0, k = c; k < i; k += d) {
            j = h(a, k, k + d, b), this.imuln(
                e), this.words[0] + j < 67108864 ? this.words[0] += j
                : this._iaddn(j);
          }
          if (0 !== g) {
            var l = 1;
            for (j = h(a, k, a.length, b), k = 0; k < g; k++) {
              l *= b;
            }
            this.imuln(l), this.words[0] + j < 67108864 ? this.words[0] += j
                : this._iaddn(j)
          }
        }, f.prototype.copy = function (a) {
          a.words = new Array(this.length);
          for (var b = 0; b < this.length; b++) {
            a.words[b] = this.words[b];
          }
          a.length = this.length, a.negative = this.negative, a.red = this.red
        }, f.prototype.clone = function () {
          var a = new f(null);
          return this.copy(a), a
        }, f.prototype._expand = function (a) {
          for (; this.length < a;) {
            this.words[this.length++] = 0;
          }
          return this
        }, f.prototype.strip = function () {
          for (; this.length > 1 && 0 === this.words[this.length
          - 1];) {
            this.length--;
          }
          return this._normSign()
        }, f.prototype._normSign = function () {
          return 1 === this.length && 0 === this.words[0]
          && (this.negative = 0), this
        }, f.prototype.inspect = function () {
          return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">"
        };
        var w = ["", "0", "00", "000", "0000", "00000", "000000", "0000000",
              "00000000", "000000000", "0000000000", "00000000000", "000000000000",
              "0000000000000", "00000000000000", "000000000000000",
              "0000000000000000", "00000000000000000", "000000000000000000",
              "0000000000000000000", "00000000000000000000",
              "000000000000000000000", "0000000000000000000000",
              "00000000000000000000000", "000000000000000000000000",
              "0000000000000000000000000"],
            x = [0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6,
              6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            y = [0, 0, 33554432, 43046721, 16777216, 48828125, 60466176,
              40353607, 16777216, 43046721, 1e7, 19487171, 35831808, 62748517,
              7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64e6,
              4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907,
              17210368, 20511149, 243e5, 28629151, 33554432, 39135393, 45435424,
              52521875, 60466176];
        f.prototype.toString = function (a, b) {
          a = a || 10, b = 0 | b || 1;
          var c;
          if (16 === a || "hex" === a) {
            c = "";
            for (var e = 0, f = 0, g = 0; g < this.length; g++) {
              var h = this.words[g], i = (16777215 & (h << e | f)).toString(16);
              f = h >>> 24 - e & 16777215, c = 0 !== f || g !== this.length - 1
                  ? w[6 - i.length] + i + c : i + c, e += 2, e >= 26
              && (e -= 26, g--)
            }
            for (0 !== f && (c = f.toString(16) + c);
                c.length % b !== 0;) {
              c = "0" + c;
            }
            return 0 !== this.negative && (c = "-" + c), c
          }
          if (a === (0 | a) && a >= 2 && a <= 36) {
            var j = x[a], k = y[a];
            c = "";
            var l = this.clone();
            for (l.negative = 0; !l.isZero();) {
              var m = l.modn(k).toString(a);
              l = l.idivn(k), c = l.isZero() ? m + c : w[j - m.length] + m + c
            }
            for (this.isZero() && (c = "0" + c); c.length % b !== 0;) {
              c = "0"
                  + c;
            }
            return 0 !== this.negative && (c = "-" + c), c
          }
          d(!1, "Base should be between 2 and 36")
        }, f.prototype.toNumber = function () {
          var a = this.words[0];
          return 2 === this.length ? a += 67108864 * this.words[1] : 3
          === this.length && 1 === this.words[2] ? a += 4503599627370496
              + 67108864 * this.words[1] : this.length > 2 && d(!1,
              "Number can only safely store up to 53 bits"), 0 !== this.negative
              ? -a : a
        }, f.prototype.toJSON = function () {
          return this.toString(16)
        }, f.prototype.toBuffer = function (a, b) {
          return d("undefined" != typeof u), this.toArrayLike(u, a, b)
        }, f.prototype.toArray = function (a, b) {
          return this.toArrayLike(Array, a, b)
        }, f.prototype.toArrayLike = function (a, b, c) {
          var e = this.byteLength(), f = c || Math.max(1, e);
          d(e <= f, "byte array longer than desired length"), d(f > 0,
              "Requested array length <= 0"), this.strip();
          var g, h, i = "le" === b, j = new a(f), k = this.clone();
          if (i) {
            for (h = 0; !k.isZero(); h++) {
              g = k.andln(255), k.iushrn(
                  8), j[h] = g;
            }
            for (; h < f; h++) {
              j[h] = 0
            }
          } else {
            for (h = 0; h < f - e; h++) {
              j[h] = 0;
            }
            for (h = 0; !k.isZero(); h++) {
              g = k.andln(255), k.iushrn(8), j[f - h
              - 1] = g
            }
          }
          return j
        }, Math.clz32 ? f.prototype._countBits = function (a) {
          return 32 - Math.clz32(a)
        } : f.prototype._countBits = function (a) {
          var b = a, c = 0;
          return b >= 4096 && (c += 13, b >>>= 13), b >= 64
          && (c += 7, b >>>= 7), b >= 8 && (c += 4, b >>>= 4), b >= 2
          && (c += 2, b >>>= 2), c + b
        }, f.prototype._zeroBits = function (a) {
          if (0 === a) {
            return 26;
          }
          var b = a, c = 0;
          return 0 === (8191 & b) && (c += 13, b >>>= 13), 0 === (127 & b)
          && (c += 7, b >>>= 7), 0 === (15 & b) && (c += 4, b >>>= 4), 0 === (3
              & b) && (c += 2, b >>>= 2), 0 === (1 & b) && c++ , c
        }, f.prototype.bitLength = function () {
          var a = this.words[this.length - 1], b = this._countBits(a);
          return 26 * (this.length - 1) + b
        }, f.prototype.zeroBits = function () {
          if (this.isZero()) {
            return 0;
          }
          for (var a = 0, b = 0; b < this.length; b++) {
            var c = this._zeroBits(this.words[b]);
            if (a += c, 26 !== c) {
              break
            }
          }
          return a
        }, f.prototype.byteLength = function () {
          return Math.ceil(this.bitLength() / 8)
        }, f.prototype.toTwos = function (a) {
          return 0 !== this.negative ? this.abs().inotn(a).iaddn(1)
              : this.clone()
        }, f.prototype.fromTwos = function (a) {
          return this.testn(a - 1) ? this.notn(a).iaddn(1).ineg() : this.clone()
        }, f.prototype.isNeg = function () {
          return 0 !== this.negative
        }, f.prototype.neg = function () {
          return this.clone().ineg()
        }, f.prototype.ineg = function () {
          return this.isZero() || (this.negative ^= 1), this
        }, f.prototype.iuor = function (a) {
          for (; this.length < a.length;) {
            this.words[this.length++] = 0;
          }
          for (var b = 0; b < a.length; b++) {
            this.words[b] = this.words[b]
                | a.words[b];
          }
          return this.strip()
        }, f.prototype.ior = function (a) {
          return d(0 === (this.negative | a.negative)), this.iuor(a)
        }, f.prototype.or = function (a) {
          return this.length > a.length ? this.clone().ior(a) : a.clone().ior(
              this)
        }, f.prototype.uor = function (a) {
          return this.length > a.length ? this.clone().iuor(a) : a.clone().iuor(
              this)
        }, f.prototype.iuand = function (a) {
          var b;
          b = this.length > a.length ? a : this;
          for (var c = 0; c < b.length; c++) {
            this.words[c] = this.words[c]
                & a.words[c];
          }
          return this.length = b.length, this.strip()
        }, f.prototype.iand = function (a) {
          return d(0 === (this.negative | a.negative)), this.iuand(a)
        }, f.prototype.and = function (a) {
          return this.length > a.length ? this.clone().iand(a) : a.clone().iand(
              this)
        }, f.prototype.uand = function (a) {
          return this.length > a.length ? this.clone().iuand(a)
              : a.clone().iuand(this)
        }, f.prototype.iuxor = function (a) {
          var b, c;
          this.length > a.length ? (b = this, c = a) : (b = a, c = this);
          for (var d = 0; d < c.length; d++) {
            this.words[d] = b.words[d]
                ^ c.words[d];
          }
          if (this !== b) {
            for (; d < b.length; d++) {
              this.words[d] = b.words[d];
            }
          }
          return this.length = b.length, this.strip()
        }, f.prototype.ixor = function (a) {
          return d(0 === (this.negative | a.negative)), this.iuxor(a)
        }, f.prototype.xor = function (a) {
          return this.length > a.length ? this.clone().ixor(a) : a.clone().ixor(
              this)
        }, f.prototype.uxor = function (a) {
          return this.length > a.length ? this.clone().iuxor(a)
              : a.clone().iuxor(this)
        }, f.prototype.inotn = function (a) {
          d("number" == typeof a && a >= 0);
          var b = 0 | Math.ceil(a / 26), c = a % 26;
          this._expand(b), c > 0 && b--;
          for (var e = 0; e < b; e++) {
            this.words[e] = 67108863 & ~this.words[e];
          }
          return c > 0 && (this.words[e] = ~this.words[e] & 67108863 >> 26
              - c), this.strip()
        }, f.prototype.notn = function (a) {
          return this.clone().inotn(a)
        }, f.prototype.setn = function (a, b) {
          d("number" == typeof a && a >= 0);
          var c = a / 26 | 0, e = a % 26;
          return this._expand(c + 1), b ? this.words[c] = this.words[c] | 1 << e
              : this.words[c] = this.words[c] & ~(1 << e), this.strip()
        }, f.prototype.iadd = function (a) {
          var b;
          if (0 !== this.negative && 0
              === a.negative) {
            return this.negative = 0, b = this.isub(
                a), this.negative ^= 1, this._normSign();
          }
          if (0 === this.negative && 0
              !== a.negative) {
            return a.negative = 0, b = this.isub(
                a), a.negative = 1, b._normSign();
          }
          var c, d;
          this.length > a.length ? (c = this, d = a) : (c = a, d = this);
          for (var e = 0, f = 0; f < d.length; f++) {
            b = (0 | c.words[f]) + (0
                | d.words[f]) + e, this.words[f] = 67108863 & b, e = b >>> 26;
          }
          for (; 0 !== e && f < c.length; f++) {
            b = (0 | c.words[f])
                + e, this.words[f] = 67108863 & b, e = b >>> 26;
          }
          if (this.length = c.length, 0
              !== e) {
            this.words[this.length] = e, this.length++;
          } else if (c
              !== this) {
            for (; f < c.length; f++) {
              this.words[f] = c.words[f];
            }
          }
          return this
        }, f.prototype.add = function (a) {
          var b;
          return 0 !== a.negative && 0 === this.negative
              ? (a.negative = 0, b = this.sub(a), a.negative ^= 1, b) : 0
              === a.negative && 0 !== this.negative
                  ? (this.negative = 0, b = a.sub(this), this.negative = 1, b)
                  : this.length > a.length ? this.clone().iadd(a)
                      : a.clone().iadd(this)
        }, f.prototype.isub = function (a) {
          if (0 !== a.negative) {
            a.negative = 0;
            var b = this.iadd(a);
            return a.negative = 1, b._normSign()
          }
          if (0 !== this.negative) {
            return this.negative = 0, this.iadd(
                a), this.negative = 1, this._normSign();
          }
          var c = this.cmp(a);
          if (0
              === c) {
            return this.negative = 0, this.length = 1, this.words[0] = 0, this;
          }
          var d, e;
          c > 0 ? (d = this, e = a) : (d = a, e = this);
          for (var f = 0, g = 0; g < e.length; g++) {
            b = (0 | d.words[g]) - (0
                | e.words[g]) + f, f = b >> 26, this.words[g] = 67108863 & b;
          }
          for (; 0 !== f && g < d.length; g++) {
            b = (0 | d.words[g]) + f, f = b
                >> 26, this.words[g] = 67108863 & b;
          }
          if (0 === f && g < d.length && d !== this) {
            for (; g < d.length;
                g++) {
              this.words[g] = d.words[g];
            }
          }
          return this.length = Math.max(this.length, g), d !== this
          && (this.negative = 1), this.strip()
        }, f.prototype.sub = function (a) {
          return this.clone().isub(a)
        };
        var z = function (a, b, c) {
          var d, e, f, g = a.words, h = b.words, i = c.words, j = 0,
              k = 0 | g[0], l = 8191 & k, m = k >>> 13, n = 0 | g[1],
              o = 8191 & n, p = n >>> 13, q = 0 | g[2], r = 8191 & q,
              s = q >>> 13, t = 0 | g[3], u = 8191 & t, v = t >>> 13,
              w = 0 | g[4], x = 8191 & w, y = w >>> 13, z = 0 | g[5],
              A = 8191 & z, B = z >>> 13, C = 0 | g[6], D = 8191 & C,
              E = C >>> 13, F = 0 | g[7], G = 8191 & F, H = F >>> 13,
              I = 0 | g[8], J = 8191 & I, K = I >>> 13, L = 0 | g[9],
              M = 8191 & L, N = L >>> 13, O = 0 | h[0], P = 8191 & O,
              Q = O >>> 13, R = 0 | h[1], S = 8191 & R, T = R >>> 13,
              U = 0 | h[2], V = 8191 & U, W = U >>> 13, X = 0 | h[3],
              Y = 8191 & X, Z = X >>> 13, $ = 0 | h[4], _ = 8191 & $,
              aa = $ >>> 13, ba = 0 | h[5], ca = 8191 & ba, da = ba >>> 13,
              ea = 0 | h[6], fa = 8191 & ea, ga = ea >>> 13, ha = 0 | h[7],
              ia = 8191 & ha, ja = ha >>> 13, ka = 0 | h[8], la = 8191 & ka,
              ma = ka >>> 13, na = 0 | h[9], oa = 8191 & na, pa = na >>> 13;
          c.negative = a.negative ^ b.negative, c.length = 19, d = Math.imul(l,
              P), e = Math.imul(l, Q), e = e + Math.imul(m, P)
              | 0, f = Math.imul(m, Q);
          var qa = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (qa >>> 26)
              | 0, qa &= 67108863, d = Math.imul(o, P), e = Math.imul(o,
              Q), e = e + Math.imul(p, P) | 0, f = Math.imul(p, Q), d = d
              + Math.imul(l, S) | 0, e = e + Math.imul(l, T) | 0, e = e
              + Math.imul(m, S) | 0, f = f + Math.imul(m, T) | 0;
          var ra = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (ra >>> 26)
              | 0, ra &= 67108863, d = Math.imul(r, P), e = Math.imul(r,
              Q), e = e + Math.imul(s, P) | 0, f = Math.imul(s, Q), d = d
              + Math.imul(o, S) | 0, e = e + Math.imul(o, T) | 0, e = e
              + Math.imul(p, S) | 0, f = f + Math.imul(p, T) | 0, d = d
              + Math.imul(l, V) | 0, e = e + Math.imul(l, W) | 0, e = e
              + Math.imul(m, V) | 0, f = f + Math.imul(m, W) | 0;
          var sa = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (sa >>> 26)
              | 0, sa &= 67108863, d = Math.imul(u, P), e = Math.imul(u,
              Q), e = e + Math.imul(v, P) | 0, f = Math.imul(v, Q), d = d
              + Math.imul(r, S) | 0, e = e + Math.imul(r, T) | 0, e = e
              + Math.imul(s, S) | 0, f = f + Math.imul(s, T) | 0, d = d
              + Math.imul(o, V) | 0, e = e + Math.imul(o, W) | 0, e = e
              + Math.imul(p, V) | 0, f = f + Math.imul(p, W) | 0, d = d
              + Math.imul(l, Y) | 0, e = e + Math.imul(l, Z) | 0, e = e
              + Math.imul(m, Y) | 0, f = f + Math.imul(m, Z) | 0;
          var ta = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (ta >>> 26)
              | 0, ta &= 67108863, d = Math.imul(x, P), e = Math.imul(x,
              Q), e = e + Math.imul(y, P) | 0, f = Math.imul(y, Q), d = d
              + Math.imul(u, S) | 0, e = e + Math.imul(u, T) | 0, e = e
              + Math.imul(v, S) | 0, f = f + Math.imul(v, T) | 0, d = d
              + Math.imul(r, V) | 0, e = e + Math.imul(r, W) | 0, e = e
              + Math.imul(s, V) | 0, f = f + Math.imul(s, W) | 0, d = d
              + Math.imul(o, Y) | 0, e = e + Math.imul(o, Z) | 0, e = e
              + Math.imul(p, Y) | 0, f = f + Math.imul(p, Z) | 0, d = d
              + Math.imul(l, _) | 0, e = e + Math.imul(l, aa) | 0, e = e
              + Math.imul(m, _) | 0, f = f + Math.imul(m, aa) | 0;
          var ua = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (ua >>> 26)
              | 0, ua &= 67108863, d = Math.imul(A, P), e = Math.imul(A,
              Q), e = e + Math.imul(B, P) | 0, f = Math.imul(B, Q), d = d
              + Math.imul(x, S) | 0, e = e + Math.imul(x, T) | 0, e = e
              + Math.imul(y, S) | 0, f = f + Math.imul(y, T) | 0, d = d
              + Math.imul(u, V) | 0, e = e + Math.imul(u, W) | 0, e = e
              + Math.imul(v, V) | 0, f = f + Math.imul(v, W) | 0, d = d
              + Math.imul(r, Y) | 0, e = e + Math.imul(r, Z) | 0, e = e
              + Math.imul(s, Y) | 0, f = f + Math.imul(s, Z) | 0, d = d
              + Math.imul(o, _) | 0, e = e + Math.imul(o, aa) | 0, e = e
              + Math.imul(p, _) | 0, f = f + Math.imul(p, aa) | 0, d = d
              + Math.imul(l, ca) | 0, e = e + Math.imul(l, da) | 0, e = e
              + Math.imul(m, ca) | 0, f = f + Math.imul(m, da) | 0;
          var va = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (va >>> 26)
              | 0, va &= 67108863, d = Math.imul(D, P), e = Math.imul(D,
              Q), e = e + Math.imul(E, P) | 0, f = Math.imul(E, Q), d = d
              + Math.imul(A, S) | 0, e = e + Math.imul(A, T) | 0, e = e
              + Math.imul(B, S) | 0, f = f + Math.imul(B, T) | 0, d = d
              + Math.imul(x, V) | 0, e = e + Math.imul(x, W) | 0, e = e
              + Math.imul(y, V) | 0, f = f + Math.imul(y, W) | 0, d = d
              + Math.imul(u, Y) | 0, e = e + Math.imul(u, Z) | 0, e = e
              + Math.imul(v, Y) | 0, f = f + Math.imul(v, Z) | 0, d = d
              + Math.imul(r, _) | 0, e = e + Math.imul(r, aa) | 0, e = e
              + Math.imul(s, _) | 0, f = f + Math.imul(s, aa) | 0, d = d
              + Math.imul(o, ca) | 0, e = e + Math.imul(o, da) | 0, e = e
              + Math.imul(p, ca) | 0, f = f + Math.imul(p, da) | 0, d = d
              + Math.imul(l, fa) | 0, e = e + Math.imul(l, ga) | 0, e = e
              + Math.imul(m, fa) | 0, f = f + Math.imul(m, ga) | 0;
          var wa = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (wa >>> 26)
              | 0, wa &= 67108863, d = Math.imul(G, P), e = Math.imul(G,
              Q), e = e + Math.imul(H, P) | 0, f = Math.imul(H, Q), d = d
              + Math.imul(D, S) | 0, e = e + Math.imul(D, T) | 0, e = e
              + Math.imul(E, S) | 0, f = f + Math.imul(E, T) | 0, d = d
              + Math.imul(A, V) | 0, e = e + Math.imul(A, W) | 0, e = e
              + Math.imul(B, V) | 0, f = f + Math.imul(B, W) | 0, d = d
              + Math.imul(x, Y) | 0, e = e + Math.imul(x, Z) | 0, e = e
              + Math.imul(y, Y) | 0, f = f + Math.imul(y, Z) | 0, d = d
              + Math.imul(u, _) | 0, e = e + Math.imul(u, aa) | 0, e = e
              + Math.imul(v, _) | 0, f = f + Math.imul(v, aa) | 0, d = d
              + Math.imul(r, ca) | 0, e = e + Math.imul(r, da) | 0, e = e
              + Math.imul(s, ca) | 0, f = f + Math.imul(s, da) | 0, d = d
              + Math.imul(o, fa) | 0, e = e + Math.imul(o, ga) | 0, e = e
              + Math.imul(p, fa) | 0, f = f + Math.imul(p, ga) | 0, d = d
              + Math.imul(l, ia) | 0, e = e + Math.imul(l, ja) | 0, e = e
              + Math.imul(m, ia) | 0, f = f + Math.imul(m, ja) | 0;
          var xa = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (xa >>> 26)
              | 0, xa &= 67108863, d = Math.imul(J, P), e = Math.imul(J,
              Q), e = e + Math.imul(K, P) | 0, f = Math.imul(K, Q), d = d
              + Math.imul(G, S) | 0, e = e + Math.imul(G, T) | 0, e = e
              + Math.imul(H, S) | 0, f = f + Math.imul(H, T) | 0, d = d
              + Math.imul(D, V) | 0, e = e + Math.imul(D, W) | 0, e = e
              + Math.imul(E, V) | 0, f = f + Math.imul(E, W) | 0, d = d
              + Math.imul(A, Y) | 0, e = e + Math.imul(A, Z) | 0, e = e
              + Math.imul(B, Y) | 0, f = f + Math.imul(B, Z) | 0, d = d
              + Math.imul(x, _) | 0, e = e + Math.imul(x, aa) | 0, e = e
              + Math.imul(y, _) | 0, f = f + Math.imul(y, aa) | 0, d = d
              + Math.imul(u, ca) | 0, e = e + Math.imul(u, da) | 0, e = e
              + Math.imul(v, ca) | 0, f = f + Math.imul(v, da) | 0, d = d
              + Math.imul(r, fa) | 0, e = e + Math.imul(r, ga) | 0, e = e
              + Math.imul(s, fa) | 0, f = f + Math.imul(s, ga) | 0, d = d
              + Math.imul(o, ia) | 0, e = e + Math.imul(o, ja) | 0, e = e
              + Math.imul(p, ia) | 0, f = f + Math.imul(p, ja) | 0, d = d
              + Math.imul(l, la) | 0, e = e + Math.imul(l, ma) | 0, e = e
              + Math.imul(m, la) | 0, f = f + Math.imul(m, ma) | 0;
          var ya = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (ya >>> 26)
              | 0, ya &= 67108863, d = Math.imul(M, P), e = Math.imul(M,
              Q), e = e + Math.imul(N, P) | 0, f = Math.imul(N, Q), d = d
              + Math.imul(J, S) | 0, e = e + Math.imul(J, T) | 0, e = e
              + Math.imul(K, S) | 0, f = f + Math.imul(K, T) | 0, d = d
              + Math.imul(G, V) | 0, e = e + Math.imul(G, W) | 0, e = e
              + Math.imul(H, V) | 0, f = f + Math.imul(H, W) | 0, d = d
              + Math.imul(D, Y) | 0, e = e + Math.imul(D, Z) | 0, e = e
              + Math.imul(E, Y) | 0, f = f + Math.imul(E, Z) | 0, d = d
              + Math.imul(A, _) | 0, e = e + Math.imul(A, aa) | 0, e = e
              + Math.imul(B, _) | 0, f = f + Math.imul(B, aa) | 0, d = d
              + Math.imul(x, ca) | 0, e = e + Math.imul(x, da) | 0, e = e
              + Math.imul(y, ca) | 0, f = f + Math.imul(y, da) | 0, d = d
              + Math.imul(u, fa) | 0, e = e + Math.imul(u, ga) | 0, e = e
              + Math.imul(v, fa) | 0, f = f + Math.imul(v, ga) | 0, d = d
              + Math.imul(r, ia) | 0, e = e + Math.imul(r, ja) | 0, e = e
              + Math.imul(s, ia) | 0, f = f + Math.imul(s, ja) | 0, d = d
              + Math.imul(o, la) | 0, e = e + Math.imul(o, ma) | 0, e = e
              + Math.imul(p, la) | 0, f = f + Math.imul(p, ma) | 0, d = d
              + Math.imul(l, oa) | 0, e = e + Math.imul(l, pa) | 0, e = e
              + Math.imul(m, oa) | 0, f = f + Math.imul(m, pa) | 0;
          var za = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (za >>> 26)
              | 0, za &= 67108863, d = Math.imul(M, S), e = Math.imul(M,
              T), e = e + Math.imul(N, S) | 0, f = Math.imul(N, T), d = d
              + Math.imul(J, V) | 0, e = e + Math.imul(J, W) | 0, e = e
              + Math.imul(K, V) | 0, f = f + Math.imul(K, W) | 0, d = d
              + Math.imul(G, Y) | 0, e = e + Math.imul(G, Z) | 0, e = e
              + Math.imul(H, Y) | 0, f = f + Math.imul(H, Z) | 0, d = d
              + Math.imul(D, _) | 0, e = e + Math.imul(D, aa) | 0, e = e
              + Math.imul(E, _) | 0, f = f + Math.imul(E, aa) | 0, d = d
              + Math.imul(A, ca) | 0, e = e + Math.imul(A, da) | 0, e = e
              + Math.imul(B, ca) | 0, f = f + Math.imul(B, da) | 0, d = d
              + Math.imul(x, fa) | 0, e = e + Math.imul(x, ga) | 0, e = e
              + Math.imul(y, fa) | 0, f = f + Math.imul(y, ga) | 0, d = d
              + Math.imul(u, ia) | 0, e = e + Math.imul(u, ja) | 0, e = e
              + Math.imul(v, ia) | 0, f = f + Math.imul(v, ja) | 0, d = d
              + Math.imul(r, la) | 0, e = e + Math.imul(r, ma) | 0, e = e
              + Math.imul(s, la) | 0, f = f + Math.imul(s, ma) | 0, d = d
              + Math.imul(o, oa) | 0, e = e + Math.imul(o, pa) | 0, e = e
              + Math.imul(p, oa) | 0, f = f + Math.imul(p, pa) | 0;
          var Aa = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Aa >>> 26)
              | 0, Aa &= 67108863, d = Math.imul(M, V), e = Math.imul(M,
              W), e = e + Math.imul(N, V) | 0, f = Math.imul(N, W), d = d
              + Math.imul(J, Y) | 0, e = e + Math.imul(J, Z) | 0, e = e
              + Math.imul(K, Y) | 0, f = f + Math.imul(K, Z) | 0, d = d
              + Math.imul(G, _) | 0, e = e + Math.imul(G, aa) | 0, e = e
              + Math.imul(H, _) | 0, f = f + Math.imul(H, aa) | 0, d = d
              + Math.imul(D, ca) | 0, e = e + Math.imul(D, da) | 0, e = e
              + Math.imul(E, ca) | 0, f = f + Math.imul(E, da) | 0, d = d
              + Math.imul(A, fa) | 0, e = e + Math.imul(A, ga) | 0, e = e
              + Math.imul(B, fa) | 0, f = f + Math.imul(B, ga) | 0, d = d
              + Math.imul(x, ia) | 0, e = e + Math.imul(x, ja) | 0, e = e
              + Math.imul(y, ia) | 0, f = f + Math.imul(y, ja) | 0, d = d
              + Math.imul(u, la) | 0, e = e + Math.imul(u, ma) | 0, e = e
              + Math.imul(v, la) | 0, f = f + Math.imul(v, ma) | 0, d = d
              + Math.imul(r, oa) | 0, e = e + Math.imul(r, pa) | 0, e = e
              + Math.imul(s, oa) | 0, f = f + Math.imul(s, pa) | 0;
          var Ba = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Ba >>> 26)
              | 0, Ba &= 67108863, d = Math.imul(M, Y), e = Math.imul(M,
              Z), e = e + Math.imul(N, Y) | 0, f = Math.imul(N, Z), d = d
              + Math.imul(J, _) | 0, e = e + Math.imul(J, aa) | 0, e = e
              + Math.imul(K, _) | 0, f = f + Math.imul(K, aa) | 0, d = d
              + Math.imul(G, ca) | 0, e = e + Math.imul(G, da) | 0, e = e
              + Math.imul(H, ca) | 0, f = f + Math.imul(H, da) | 0, d = d
              + Math.imul(D, fa) | 0, e = e + Math.imul(D, ga) | 0, e = e
              + Math.imul(E, fa) | 0, f = f + Math.imul(E, ga) | 0, d = d
              + Math.imul(A, ia) | 0, e = e + Math.imul(A, ja) | 0, e = e
              + Math.imul(B, ia) | 0, f = f + Math.imul(B, ja) | 0, d = d
              + Math.imul(x, la) | 0, e = e + Math.imul(x, ma) | 0, e = e
              + Math.imul(y, la) | 0, f = f + Math.imul(y, ma) | 0, d = d
              + Math.imul(u, oa) | 0, e = e + Math.imul(u, pa) | 0, e = e
              + Math.imul(v, oa) | 0, f = f + Math.imul(v, pa) | 0;
          var Ca = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Ca >>> 26)
              | 0, Ca &= 67108863, d = Math.imul(M, _), e = Math.imul(M,
              aa), e = e + Math.imul(N, _) | 0, f = Math.imul(N, aa), d = d
              + Math.imul(J, ca) | 0, e = e + Math.imul(J, da) | 0, e = e
              + Math.imul(K, ca) | 0, f = f + Math.imul(K, da) | 0, d = d
              + Math.imul(G, fa) | 0, e = e + Math.imul(G, ga) | 0, e = e
              + Math.imul(H, fa) | 0, f = f + Math.imul(H, ga) | 0, d = d
              + Math.imul(D, ia) | 0, e = e + Math.imul(D, ja) | 0, e = e
              + Math.imul(E, ia) | 0, f = f + Math.imul(E, ja) | 0, d = d
              + Math.imul(A, la) | 0, e = e + Math.imul(A, ma) | 0, e = e
              + Math.imul(B, la) | 0, f = f + Math.imul(B, ma) | 0, d = d
              + Math.imul(x, oa) | 0, e = e + Math.imul(x, pa) | 0, e = e
              + Math.imul(y, oa) | 0, f = f + Math.imul(y, pa) | 0;
          var Da = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Da >>> 26)
              | 0, Da &= 67108863, d = Math.imul(M, ca), e = Math.imul(M,
              da), e = e + Math.imul(N, ca) | 0, f = Math.imul(N, da), d = d
              + Math.imul(J, fa) | 0, e = e + Math.imul(J, ga) | 0, e = e
              + Math.imul(K, fa) | 0, f = f + Math.imul(K, ga) | 0, d = d
              + Math.imul(G, ia) | 0, e = e + Math.imul(G, ja) | 0, e = e
              + Math.imul(H, ia) | 0, f = f + Math.imul(H, ja) | 0, d = d
              + Math.imul(D, la) | 0, e = e + Math.imul(D, ma) | 0, e = e
              + Math.imul(E, la) | 0, f = f + Math.imul(E, ma) | 0, d = d
              + Math.imul(A, oa) | 0, e = e + Math.imul(A, pa) | 0, e = e
              + Math.imul(B, oa) | 0, f = f + Math.imul(B, pa) | 0;
          var Ea = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Ea >>> 26)
              | 0, Ea &= 67108863, d = Math.imul(M, fa), e = Math.imul(M,
              ga), e = e + Math.imul(N, fa) | 0, f = Math.imul(N, ga), d = d
              + Math.imul(J, ia) | 0, e = e + Math.imul(J, ja) | 0, e = e
              + Math.imul(K, ia) | 0, f = f + Math.imul(K, ja) | 0, d = d
              + Math.imul(G, la) | 0, e = e + Math.imul(G, ma) | 0, e = e
              + Math.imul(H, la) | 0, f = f + Math.imul(H, ma) | 0, d = d
              + Math.imul(D, oa) | 0, e = e + Math.imul(D, pa) | 0, e = e
              + Math.imul(E, oa) | 0, f = f + Math.imul(E, pa) | 0;
          var Fa = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Fa >>> 26)
              | 0, Fa &= 67108863, d = Math.imul(M, ia), e = Math.imul(M,
              ja), e = e + Math.imul(N, ia) | 0, f = Math.imul(N, ja), d = d
              + Math.imul(J, la) | 0, e = e + Math.imul(J, ma) | 0, e = e
              + Math.imul(K, la) | 0, f = f + Math.imul(K, ma) | 0, d = d
              + Math.imul(G, oa) | 0, e = e + Math.imul(G, pa) | 0, e = e
              + Math.imul(H, oa) | 0, f = f + Math.imul(H, pa) | 0;
          var Ga = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Ga >>> 26)
              | 0, Ga &= 67108863, d = Math.imul(M, la), e = Math.imul(M,
              ma), e = e + Math.imul(N, la) | 0, f = Math.imul(N, ma), d = d
              + Math.imul(J, oa) | 0, e = e + Math.imul(J, pa) | 0, e = e
              + Math.imul(K, oa) | 0, f = f + Math.imul(K, pa) | 0;
          var Ha = (j + d | 0) + ((8191 & e) << 13) | 0;
          j = (f + (e >>> 13) | 0) + (Ha >>> 26)
              | 0, Ha &= 67108863, d = Math.imul(M, oa), e = Math.imul(M,
              pa), e = e + Math.imul(N, oa) | 0, f = Math.imul(N, pa);
          var Ia = (j + d | 0) + ((8191 & e) << 13) | 0;
          return j = (f + (e >>> 13) | 0) + (Ia >>> 26)
              | 0, Ia &= 67108863, i[0] = qa, i[1] = ra, i[2] = sa, i[3] = ta, i[4] = ua, i[5] = va, i[6] = wa, i[7] = xa, i[8] = ya, i[9] = za, i[10] = Aa, i[11] = Ba, i[12] = Ca, i[13] = Da, i[14] = Ea, i[15] = Fa, i[16] = Ga, i[17] = Ha, i[18] = Ia, 0
          !== j && (i[19] = j, c.length++), c
        };
        Math.imul || (z = j), f.prototype.mulTo = function (a, b) {
          var c, d = this.length + a.length;
          return c = 10 === this.length && 10 === a.length ? z(this, a, b) : d
          < 63 ? j(this, a, b) : d < 1024 ? k(this, a, b) : l(this, a, b)
        }, m.prototype.makeRBT = function (a) {
          for (var b = new Array(a), c = f.prototype._countBits(a) - 1, d = 0;
              d < a; d++) {
            b[d] = this.revBin(d, c, a);
          }
          return b
        }, m.prototype.revBin = function (a, b, c) {
          if (0 === a || a === c - 1) {
            return a;
          }
          for (var d = 0, e = 0; e < b; e++) {
            d |= (1 & a) << b - e - 1, a >>= 1;
          }
          return d
        }, m.prototype.permute = function (a, b, c, d, e, f) {
          for (var g = 0; g < f; g++) {
            d[g] = b[a[g]], e[g] = c[a[g]]
          }
        }, m.prototype.transform = function (a, b, c, d, e, f) {
          this.permute(f, a, b, c, d, e);
          for (var g = 1; g < e; g <<= 1) {
            for (var h = g << 1,
                i = Math.cos(2 * Math.PI / h), j = Math.sin(2 * Math.PI / h),
                k = 0; k < e; k += h) {
              for (var l = i, m = j, n = 0; n < g; n++) {
                var o = c[k + n], p = d[k + n], q = c[k + n + g],
                    r = d[k + n + g],
                    s = l * q - m * r;
                r = l * r + m * q, q = s, c[k + n] = o + q, d[k + n] = p
                    + r, c[k
                + n + g] = o - q, d[k + n + g] = p - r, n !== h && (s = i * l
                    - j
                    * m, m = i * m + j * l, l = s)
              }
            }
          }
        }, m.prototype.guessLen13b = function (a, b) {
          var c = 1 | Math.max(b, a), d = 1 & c, e = 0;
          for (c = c / 2 | 0; c; c >>>= 1) {
            e++;
          }
          return 1 << e + 1 + d
        }, m.prototype.conjugate = function (a, b, c) {
          if (!(c <= 1)) {
            for (var d = 0; d < c / 2; d++) {
              var e = a[d];
              a[d] = a[c - d - 1], a[c - d - 1] = e, e = b[d], b[d] = -b[c - d
              - 1], b[c - d - 1] = -e
            }
          }
        }, m.prototype.normalize13b = function (a, b) {
          for (var c = 0, d = 0; d < b / 2; d++) {
            var e = 8192 * Math.round(a[2 * d + 1] / b) + Math.round(a[2 * d]
                / b) + c;
            a[d] = 67108863 & e, c = e < 67108864 ? 0 : e / 67108864 | 0
          }
          return a
        }, m.prototype.convert13b = function (a, b, c, e) {
          for (var f = 0, g = 0; g < b; g++) {
            f += 0 | a[g], c[2 * g] = 8191
                & f, f >>>= 13, c[2 * g + 1] = 8191 & f, f >>>= 13;
          }
          for (g = 2 * b; g < e; ++g) {
            c[g] = 0;
          }
          d(0 === f), d(0 === (f & -8192))
        }, m.prototype.stub = function (a) {
          for (var b = new Array(a), c = 0; c < a; c++) {
            b[c] = 0;
          }
          return b
        }, m.prototype.mulp = function (a, b, c) {
          var d = 2 * this.guessLen13b(a.length, b.length), e = this.makeRBT(d),
              f = this.stub(d), g = new Array(d), h = new Array(d),
              i = new Array(d), j = new Array(d), k = new Array(d),
              l = new Array(d), m = c.words;
          m.length = d, this.convert13b(a.words, a.length, g,
              d), this.convert13b(b.words, b.length, j, d), this.transform(g, f,
              h, i, d, e), this.transform(j, f, k, l, d, e);
          for (var n = 0; n < d; n++) {
            var o = h[n] * k[n] - i[n] * l[n];
            i[n] = h[n] * l[n] + i[n] * k[n], h[n] = o
          }
          return this.conjugate(h, i, d), this.transform(h, i, m, f, d,
              e), this.conjugate(m, f, d), this.normalize13b(m,
              d), c.negative = a.negative ^ b.negative, c.length = a.length
              + b.length, c.strip()
        }, f.prototype.mul = function (a) {
          var b = new f(null);
          return b.words = new Array(this.length + a.length), this.mulTo(a, b)
        }, f.prototype.mulf = function (a) {
          var b = new f(null);
          return b.words = new Array(this.length + a.length), l(this, a, b)
        }, f.prototype.imul = function (a) {
          return this.clone().mulTo(a, this)
        }, f.prototype.imuln = function (a) {
          d("number" == typeof a), d(a < 67108864);
          for (var b = 0, c = 0; c < this.length; c++) {
            var e = (0 | this.words[c]) * a,
                f = (67108863 & e) + (67108863 & b);
            b >>= 26, b += e / 67108864 | 0, b += f
                >>> 26, this.words[c] = 67108863 & f
          }
          return 0 !== b && (this.words[c] = b, this.length++), this
        }, f.prototype.muln = function (a) {
          return this.clone().imuln(a)
        }, f.prototype.sqr = function () {
          return this.mul(this)
        }, f.prototype.isqr = function () {
          return this.imul(this.clone())
        }, f.prototype.pow = function (a) {
          var b = i(a);
          if (0 === b.length) {
            return new f(1);
          }
          for (var c = this, d = 0; d < b.length && 0 === b[d];
              d++ , c = c.sqr()) {
            ;
          }
          if (++d < b.length) {
            for (var e = c.sqr(); d < b.length;
                d++ , e = e.sqr()) {
              0 !== b[d] && (c = c.mul(e));
            }
          }
          return c
        }, f.prototype.iushln = function (a) {
          d("number" == typeof a && a >= 0);
          var b, c = a % 26, e = (a - c) / 26,
              f = 67108863 >>> 26 - c << 26 - c;
          if (0 !== c) {
            var g = 0;
            for (b = 0; b < this.length; b++) {
              var h = this.words[b] & f, i = (0 | this.words[b]) - h << c;
              this.words[b] = i | g, g = h >>> 26 - c
            }
            g && (this.words[b] = g, this.length++)
          }
          if (0 !== e) {
            for (b = this.length - 1; b >= 0; b--) {
              this.words[b
              + e] = this.words[b];
            }
            for (b = 0; b < e; b++) {
              this.words[b] = 0;
            }
            this.length += e
          }
          return this.strip()
        }, f.prototype.ishln = function (a) {
          return d(0 === this.negative), this.iushln(a)
        }, f.prototype.iushrn = function (a, b, c) {
          d("number" == typeof a && a >= 0);
          var e;
          e = b ? (b - b % 26) / 26 : 0;
          var f = a % 26, g = Math.min((a - f) / 26, this.length),
              h = 67108863 ^ 67108863 >>> f << f, i = c;
          if (e -= g, e = Math.max(0, e), i) {
            for (var j = 0; j < g; j++) {
              i.words[j] = this.words[j];
            }
            i.length = g
          }
          if (0 === g) {
            ;
          } else if (this.length > g) {
            for (this.length -= g, j = 0;
                j < this.length; j++) {
              this.words[j] = this.words[j
              + g];
            }
          } else {
            this.words[0] = 0, this.length = 1;
          }
          var k = 0;
          for (j = this.length - 1; j >= 0 && (0 !== k || j >= e); j--) {
            var l = 0 | this.words[j];
            this.words[j] = k << 26 - f | l >>> f, k = l & h
          }
          return i && 0 !== k && (i.words[i.length++] = k), 0 === this.length
          && (this.words[0] = 0, this.length = 1), this.strip()
        }, f.prototype.ishrn = function (a, b, c) {
          return d(0 === this.negative), this.iushrn(a, b, c)
        }, f.prototype.shln = function (a) {
          return this.clone().ishln(a)
        }, f.prototype.ushln = function (a) {
          return this.clone().iushln(a)
        }, f.prototype.shrn = function (a) {
          return this.clone().ishrn(a)
        }, f.prototype.ushrn = function (a) {
          return this.clone().iushrn(a)
        }, f.prototype.testn = function (a) {
          d("number" == typeof a && a >= 0);
          var b = a % 26, c = (a - b) / 26, e = 1 << b;
          if (this.length <= c) {
            return !1;
          }
          var f = this.words[c];
          return !!(f & e)
        }, f.prototype.imaskn = function (a) {
          d("number" == typeof a && a >= 0);
          var b = a % 26, c = (a - b) / 26;
          if (d(0 === this.negative,
                  "imaskn works only with positive numbers"), this.length
              <= c) {
            return this;
          }
          if (0 !== b && c++ , this.length = Math.min(c, this.length), 0
              !== b) {
            var e = 67108863 ^ 67108863 >>> b << b;
            this.words[this.length - 1] &= e
          }
          return this.strip()
        }, f.prototype.maskn = function (a) {
          return this.clone().imaskn(a)
        }, f.prototype.iaddn = function (a) {
          return d("number" == typeof a), d(a < 67108864), a < 0 ? this.isubn(
              -a) : 0 !== this.negative ? 1 === this.length && (0
              | this.words[0]) < a ? (this.words[0] = a - (0
              | this.words[0]), this.negative = 0, this)
              : (this.negative = 0, this.isubn(a), this.negative = 1, this)
              : this._iaddn(a)
        }, f.prototype._iaddn = function (a) {
          this.words[0] += a;
          for (var b = 0; b < this.length && this.words[b] >= 67108864;
              b++) {
            this.words[b] -= 67108864, b === this.length - 1
                ? this.words[b + 1] = 1 : this.words[b + 1]++;
          }
          return this.length = Math.max(this.length, b + 1), this
        }, f.prototype.isubn = function (a) {
          if (d("number" == typeof a), d(a < 67108864), a
              < 0) {
            return this.iaddn(-a);
          }
          if (0 !== this.negative) {
            return this.negative = 0, this.iaddn(
                a), this.negative = 1, this;
          }
          if (this.words[0] -= a, 1 === this.length && this.words[0]
              < 0) {
            this.words[0] = -this.words[0], this.negative = 1;
          } else {
            for (var b = 0;
                b < this.length && this.words[b] < 0;
                b++) {
              this.words[b] += 67108864, this.words[b + 1] -= 1;
            }
          }
          return this.strip()
        }, f.prototype.addn = function (a) {
          return this.clone().iaddn(a)
        }, f.prototype.subn = function (a) {
          return this.clone().isubn(a)
        }, f.prototype.iabs = function () {
          return this.negative = 0, this
        }, f.prototype.abs = function () {
          return this.clone().iabs()
        }, f.prototype._ishlnsubmul = function (a, b, c) {
          var e, f = a.length + c;
          this._expand(f);
          var g, h = 0;
          for (e = 0; e < a.length; e++) {
            g = (0 | this.words[e + c]) + h;
            var i = (0 | a.words[e]) * b;
            g -= 67108863 & i, h = (g >> 26) - (i / 67108864 | 0), this.words[e
            + c] = 67108863 & g
          }
          for (; e < this.length - c; e++) {
            g = (0 | this.words[e + c])
                + h, h = g >> 26, this.words[e + c] = 67108863 & g;
          }
          if (0 === h) {
            return this.strip();
          }
          for (d(h === -1), h = 0, e = 0; e < this.length; e++) {
            g = -(0
                | this.words[e]) + h, h = g >> 26, this.words[e] = 67108863 & g;
          }
          return this.negative = 1, this.strip()
        }, f.prototype._wordDiv = function (a, b) {
          var c = this.length - a.length, d = this.clone(), e = a,
              g = 0 | e.words[e.length - 1], h = this._countBits(g);
          c = 26 - h, 0 !== c && (e = e.ushln(c), d.iushln(c), g = 0
              | e.words[e.length - 1]);
          var i, j = d.length - e.length;
          if ("mod" !== b) {
            i = new f(null), i.length = j + 1, i.words = new Array(i.length);
            for (var k = 0; k < i.length; k++) {
              i.words[k] = 0
            }
          }
          var l = d.clone()._ishlnsubmul(e, 1, j);
          0 === l.negative && (d = l, i && (i.words[j] = 1));
          for (var m = j - 1; m >= 0; m--) {
            var n = 67108864 * (0 | d.words[e.length + m]) + (0
                | d.words[e.length + m - 1]);
            for (n = Math.min(n / g | 0, 67108863), d._ishlnsubmul(e, n, m);
                0 !== d.negative;) {
              n-- , d.negative = 0, d._ishlnsubmul(e, 1,
                  m), d.isZero() || (d.negative ^= 1);
            }
            i && (i.words[m] = n)
          }
          return i && i.strip(), d.strip(), "div" !== b && 0 !== c && d.iushrn(
              c), {div: i || null, mod: d}
        }, f.prototype.divmod = function (a, b, c) {
          if (d(!a.isZero()), this.isZero()) {
            return {
              div: new f(0),
              mod: new f(0)
            };
          }
          var e, g, h;
          return 0 !== this.negative && 0 === a.negative
              ? (h = this.neg().divmod(a, b), "mod" !== b
              && (e = h.div.neg()), "div" !== b && (g = h.mod.neg(), c && 0
              !== g.negative && g.iadd(a)), {div: e, mod: g}) : 0
              === this.negative && 0 !== a.negative ? (h = this.divmod(a.neg(),
                  b), "mod" !== b && (e = h.div.neg()), {div: e, mod: h.mod})
                  : 0 !== (this.negative & a.negative) ? (h = this.neg().divmod(
                      a.neg(), b), "div" !== b && (g = h.mod.neg(), c && 0
                  !== g.negative && g.isub(a)), {div: h.div, mod: g}) : a.length
                  > this.length || this.cmp(a) < 0 ? {div: new f(0), mod: this}
                      : 1 === a.length ? "div" === b ? {
                        div: this.divn(a.words[0]), mod: null
                      } : "mod" === b ? {
                        div: null,
                        mod: new f(this.modn(a.words[0]))
                      } : {
                        div: this.divn(a.words[0]),
                        mod: new f(this.modn(a.words[0]))
                      } : this._wordDiv(a, b)
        }, f.prototype.div = function (a) {
          return this.divmod(a, "div", !1).div
        }, f.prototype.mod = function (a) {
          return this.divmod(a, "mod", !1).mod
        }, f.prototype.umod = function (a) {
          return this.divmod(a, "mod", !0).mod
        }, f.prototype.divRound = function (a) {
          var b = this.divmod(a);
          if (b.mod.isZero()) {
            return b.div;
          }
          var c = 0 !== b.div.negative ? b.mod.isub(a) : b.mod, d = a.ushrn(1),
              e = a.andln(1), f = c.cmp(d);
          return f < 0 || 1 === e && 0 === f ? b.div : 0 !== b.div.negative
              ? b.div.isubn(1) : b.div.iaddn(1)
        }, f.prototype.modn = function (a) {
          d(a <= 67108863);
          for (var b = (1 << 26) % a, c = 0, e = this.length - 1; e >= 0;
              e--) {
            c = (b * c + (0 | this.words[e])) % a;
          }
          return c
        }, f.prototype.idivn = function (a) {
          d(a <= 67108863);
          for (var b = 0, c = this.length - 1; c >= 0; c--) {
            var e = (0 | this.words[c]) + 67108864 * b;
            this.words[c] = e / a | 0, b = e % a
          }
          return this.strip()
        }, f.prototype.divn = function (a) {
          return this.clone().idivn(a)
        }, f.prototype.egcd = function (a) {
          d(0 === a.negative), d(!a.isZero());
          var b = this, c = a.clone();
          b = 0 !== b.negative ? b.umod(a) : b.clone();
          for (var e = new f(1), g = new f(0), h = new f(0), i = new f(1),
              j = 0; b.isEven() && c.isEven();) {
            b.iushrn(1), c.iushrn(1), ++j;
          }
          for (var k = c.clone(), l = b.clone(); !b.isZero();) {
            for (var m = 0, n = 1; 0 === (b.words[0] & n) && m < 26;
                ++m, n <<= 1) {
              ;
            }
            if (m > 0) {
              for (b.iushrn(m); m-- > 0;) {
                (e.isOdd() || g.isOdd())
                && (e.iadd(k), g.isub(l)), e.iushrn(1), g.iushrn(1);
              }
            }
            for (var o = 0, p = 1; 0 === (c.words[0] & p) && o < 26;
                ++o, p <<= 1) {
              ;
            }
            if (o > 0) {
              for (c.iushrn(o); o-- > 0;) {
                (h.isOdd() || i.isOdd())
                && (h.iadd(k), i.isub(l)), h.iushrn(1), i.iushrn(1);
              }
            }
            b.cmp(c) >= 0 ? (b.isub(c), e.isub(h), g.isub(i)) : (c.isub(
                b), h.isub(e), i.isub(g))
          }
          return {a: h, b: i, gcd: c.iushln(j)}
        }, f.prototype._invmp = function (a) {
          d(0 === a.negative), d(!a.isZero());
          var b = this, c = a.clone();
          b = 0 !== b.negative ? b.umod(a) : b.clone();
          for (var e = new f(1), g = new f(0), h = c.clone();
              b.cmpn(1) > 0 && c.cmpn(1) > 0;) {
            for (var i = 0, j = 1; 0 === (b.words[0] & j) && i < 26;
                ++i, j <<= 1) {
              ;
            }
            if (i > 0) {
              for (b.iushrn(i); i-- > 0;) {
                e.isOdd() && e.iadd(
                    h), e.iushrn(1);
              }
            }
            for (var k = 0, l = 1; 0 === (c.words[0] & l) && k < 26;
                ++k, l <<= 1) {
              ;
            }
            if (k > 0) {
              for (c.iushrn(k); k-- > 0;) {
                g.isOdd() && g.iadd(
                    h), g.iushrn(1);
              }
            }
            b.cmp(c) >= 0 ? (b.isub(c), e.isub(g)) : (c.isub(b), g.isub(e))
          }
          var m;
          return m = 0 === b.cmpn(1) ? e : g, m.cmpn(0) < 0 && m.iadd(a), m
        }, f.prototype.gcd = function (a) {
          if (this.isZero()) {
            return a.abs();
          }
          if (a.isZero()) {
            return this.abs();
          }
          var b = this.clone(), c = a.clone();
          b.negative = 0, c.negative = 0;
          for (var d = 0; b.isEven() && c.isEven(); d++) {
            b.iushrn(1), c.iushrn(
                1);
          }
          for (; ;) {
            for (; b.isEven();) {
              b.iushrn(1);
            }
            for (; c.isEven();) {
              c.iushrn(1);
            }
            var e = b.cmp(c);
            if (e < 0) {
              var f = b;
              b = c, c = f
            } else if (0 === e || 0 === c.cmpn(1)) {
              break;
            }
            b.isub(c)
          }
          return c.iushln(d)
        }, f.prototype.invm = function (a) {
          return this.egcd(a).a.umod(a)
        }, f.prototype.isEven = function () {
          return 0 === (1 & this.words[0])
        }, f.prototype.isOdd = function () {
          return 1 === (1 & this.words[0])
        }, f.prototype.andln = function (a) {
          return this.words[0] & a
        }, f.prototype.bincn = function (a) {
          d("number" == typeof a);
          var b = a % 26, c = (a - b) / 26, e = 1 << b;
          if (this.length <= c) {
            return this._expand(c
                + 1), this.words[c] |= e, this;
          }
          for (var f = e, g = c; 0 !== f && g < this.length; g++) {
            var h = 0 | this.words[g];
            h += f, f = h >>> 26, h &= 67108863, this.words[g] = h
          }
          return 0 !== f && (this.words[g] = f, this.length++), this
        }, f.prototype.isZero = function () {
          return 1 === this.length && 0 === this.words[0]
        }, f.prototype.cmpn = function (a) {
          var b = a < 0;
          if (0 !== this.negative && !b) {
            return -1;
          }
          if (0 === this.negative && b) {
            return 1;
          }
          this.strip();
          var c;
          if (this.length > 1) {
            c = 1;
          } else {
            b && (a = -a), d(a <= 67108863, "Number is too big");
            var e = 0 | this.words[0];
            c = e === a ? 0 : e < a ? -1 : 1
          }
          return 0 !== this.negative ? 0 | -c : c
        }, f.prototype.cmp = function (a) {
          if (0 !== this.negative && 0 === a.negative) {
            return -1;
          }
          if (0 === this.negative && 0 !== a.negative) {
            return 1;
          }
          var b = this.ucmp(a);
          return 0 !== this.negative ? 0 | -b : b
        }, f.prototype.ucmp = function (a) {
          if (this.length > a.length) {
            return 1;
          }
          if (this.length < a.length) {
            return -1;
          }
          for (var b = 0, c = this.length - 1; c >= 0; c--) {
            var d = 0 | this.words[c], e = 0 | a.words[c];
            if (d !== e) {
              d < e ? b = -1 : d > e && (b = 1);
              break
            }
          }
          return b
        }, f.prototype.gtn = function (a) {
          return 1 === this.cmpn(a)
        }, f.prototype.gt = function (a) {
          return 1 === this.cmp(a)
        }, f.prototype.gten = function (a) {
          return this.cmpn(a) >= 0
        }, f.prototype.gte = function (a) {
          return this.cmp(a) >= 0
        }, f.prototype.ltn = function (a) {
          return this.cmpn(a) === -1
        }, f.prototype.lt = function (a) {
          return this.cmp(a) === -1
        }, f.prototype.lten = function (a) {
          return this.cmpn(a) <= 0
        }, f.prototype.lte = function (a) {
          return this.cmp(a) <= 0
        }, f.prototype.eqn = function (a) {
          return 0 === this.cmpn(a)
        }, f.prototype.eq = function (a) {
          return 0 === this.cmp(a)
        }, f.red = function (a) {
          return new s(a)
        }, f.prototype.toRed = function (a) {
          return d(!this.red, "Already a number in reduction context"), d(0
              === this.negative, "red works only with positives"), a.convertTo(
              this)._forceRed(a)
        }, f.prototype.fromRed = function () {
          return d(this.red,
              "fromRed works only with numbers in reduction context"), this.red.convertFrom(
              this)
        }, f.prototype._forceRed = function (a) {
          return this.red = a, this
        }, f.prototype.forceRed = function (a) {
          return d(!this.red,
              "Already a number in reduction context"), this._forceRed(a)
        }, f.prototype.redAdd = function (a) {
          return d(this.red,
              "redAdd works only with red numbers"), this.red.add(this, a)
        }, f.prototype.redIAdd = function (a) {
          return d(this.red,
              "redIAdd works only with red numbers"), this.red.iadd(this, a)
        }, f.prototype.redSub = function (a) {
          return d(this.red,
              "redSub works only with red numbers"), this.red.sub(this, a)
        }, f.prototype.redISub = function (a) {
          return d(this.red,
              "redISub works only with red numbers"), this.red.isub(this, a)
        }, f.prototype.redShl = function (a) {
          return d(this.red,
              "redShl works only with red numbers"), this.red.shl(this, a)
        }, f.prototype.redMul = function (a) {
          return d(this.red,
              "redMul works only with red numbers"), this.red._verify2(this,
              a), this.red.mul(this, a)
        }, f.prototype.redIMul = function (a) {
          return d(this.red,
              "redMul works only with red numbers"), this.red._verify2(this,
              a), this.red.imul(this, a)
        }, f.prototype.redSqr = function () {
          return d(this.red,
              "redSqr works only with red numbers"), this.red._verify1(
              this), this.red.sqr(this)
        }, f.prototype.redISqr = function () {
          return d(this.red,
              "redISqr works only with red numbers"), this.red._verify1(
              this), this.red.isqr(this)
        }, f.prototype.redSqrt = function () {
          return d(this.red,
              "redSqrt works only with red numbers"), this.red._verify1(
              this), this.red.sqrt(this)
        }, f.prototype.redInvm = function () {
          return d(this.red,
              "redInvm works only with red numbers"), this.red._verify1(
              this), this.red.invm(this)
        }, f.prototype.redNeg = function () {
          return d(this.red,
              "redNeg works only with red numbers"), this.red._verify1(
              this), this.red.neg(this)
        }, f.prototype.redPow = function (a) {
          return d(this.red && !a.red, "redPow(normalNum)"), this.red._verify1(
              this), this.red.pow(this, a)
        };
        var A = {k256: null, p224: null, p192: null, p25519: null};
        n.prototype._tmp = function () {
          var a = new f(null);
          return a.words = new Array(Math.ceil(this.n / 13)), a
        }, n.prototype.ireduce = function (a) {
          var b, c = a;
          do {
            this.split(c, this.tmp), c = this.imulK(c), c = c.iadd(
                this.tmp), b = c.bitLength();
          } while (b > this.n);
          var d = b < this.n ? -1 : c.ucmp(this.p);
          return 0 === d ? (c.words[0] = 0, c.length = 1) : d > 0 ? c.isub(
              this.p) : c.strip(), c
        }, n.prototype.split = function (a, b) {
          a.iushrn(this.n, 0, b)
        }, n.prototype.imulK = function (a) {
          return a.imul(this.k)
        }, e(o, n), o.prototype.split = function (a, b) {
          for (var c = 4194303, d = Math.min(a.length, 9), e = 0; e < d;
              e++) {
            b.words[e] = a.words[e];
          }
          if (b.length = d, a.length
              <= 9) {
            return a.words[0] = 0, void (a.length = 1);
          }
          var f = a.words[9];
          for (b.words[b.length++] = f & c, e = 10; e < a.length; e++) {
            var g = 0 | a.words[e];
            a.words[e - 10] = (g & c) << 4 | f >>> 22, f = g
          }
          f >>>= 22, a.words[e - 10] = f, 0 === f && a.length > 10
              ? a.length -= 10 : a.length -= 9
        }, o.prototype.imulK = function (a) {
          a.words[a.length] = 0, a.words[a.length + 1] = 0, a.length += 2;
          for (var b = 0, c = 0; c < a.length; c++) {
            var d = 0 | a.words[c];
            b += 977 * d, a.words[c] = 67108863 & b, b = 64 * d + (b / 67108864
                | 0)
          }
          return 0 === a.words[a.length - 1] && (a.length-- , 0
          === a.words[a.length - 1] && a.length--), a
        }, e(p, n), e(q, n), e(r, n), r.prototype.imulK = function (a) {
          for (var b = 0, c = 0; c < a.length; c++) {
            var d = 19 * (0 | a.words[c]) + b, e = 67108863 & d;
            d >>>= 26, a.words[c] = e, b = d
          }
          return 0 !== b && (a.words[a.length++] = b), a
        }, f._prime = function B(a) {
          if (A[a]) {
            return A[a];
          }
          var B;
          if ("k256" === a) {
            B = new o;
          } else if ("p224"
              === a) {
            B = new p;
          } else if ("p192" === a) {
            B = new q;
          } else {
            if ("p25519" !== a) {
              throw new Error("Unknown prime " + a);
            }
            B = new r
          }
          return A[a] = B, B
        }, s.prototype._verify1 = function (a) {
          d(0 === a.negative, "red works only with positives"), d(a.red,
              "red works only with red numbers")
        }, s.prototype._verify2 = function (a, b) {
          d(0 === (a.negative | b.negative),
              "red works only with positives"), d(a.red && a.red === b.red,
              "red works only with red numbers")
        }, s.prototype.imod = function (a) {
          return this.prime ? this.prime.ireduce(a)._forceRed(this) : a.umod(
              this.m)._forceRed(this)
        }, s.prototype.neg = function (a) {
          return a.isZero() ? a.clone() : this.m.sub(a)._forceRed(this)
        }, s.prototype.add = function (a, b) {
          this._verify2(a, b);
          var c = a.add(b);
          return c.cmp(this.m) >= 0 && c.isub(this.m), c._forceRed(this)
        }, s.prototype.iadd = function (a, b) {
          this._verify2(a, b);
          var c = a.iadd(b);
          return c.cmp(this.m) >= 0 && c.isub(this.m), c
        }, s.prototype.sub = function (a, b) {
          this._verify2(a, b);
          var c = a.sub(b);
          return c.cmpn(0) < 0 && c.iadd(this.m), c._forceRed(this)
        }, s.prototype.isub = function (a, b) {
          this._verify2(a, b);
          var c = a.isub(b);
          return c.cmpn(0) < 0 && c.iadd(this.m), c
        }, s.prototype.shl = function (a, b) {
          return this._verify1(a), this.imod(a.ushln(b))
        }, s.prototype.imul = function (a, b) {
          return this._verify2(a, b), this.imod(a.imul(b))
        }, s.prototype.mul = function (a, b) {
          return this._verify2(a, b), this.imod(a.mul(b))
        }, s.prototype.isqr = function (a) {
          return this.imul(a, a.clone())
        }, s.prototype.sqr = function (a) {
          return this.mul(a, a)
        }, s.prototype.sqrt = function (a) {
          if (a.isZero()) {
            return a.clone();
          }
          var b = this.m.andln(3);
          if (d(b % 2 === 1), 3 === b) {
            var c = this.m.add(new f(1)).iushrn(2);
            return this.pow(a, c)
          }
          for (var e = this.m.subn(1), g = 0;
              !e.isZero() && 0 === e.andln(1);) {
            g++ , e.iushrn(1);
          }
          d(!e.isZero());
          var h = new f(1).toRed(this), i = h.redNeg(),
              j = this.m.subn(1).iushrn(1), k = this.m.bitLength();
          for (k = new f(2 * k * k).toRed(this);
              0 !== this.pow(k, j).cmp(i);) {
            k.redIAdd(i);
          }
          for (var l = this.pow(k, e), m = this.pow(a, e.addn(1).iushrn(1)),
              n = this.pow(a, e), o = g; 0 !== n.cmp(h);) {
            for (var p = n, q = 0; 0 !== p.cmp(h); q++) {
              p = p.redSqr();
            }
            d(q < o);
            var r = this.pow(l, new f(1).iushln(o - q - 1));
            m = m.redMul(r), l = r.redSqr(), n = n.redMul(l), o = q
          }
          return m
        }, s.prototype.invm = function (a) {
          var b = a._invmp(this.m);
          return 0 !== b.negative ? (b.negative = 0, this.imod(b).redNeg())
              : this.imod(b)
        }, s.prototype.pow = function (a, b) {
          if (b.isZero()) {
            return new f(1);
          }
          if (0 === b.cmpn(1)) {
            return a.clone();
          }
          var c = 4, d = new Array(1 << c);
          d[0] = new f(1).toRed(this), d[1] = a;
          for (var e = 2; e < d.length; e++) {
            d[e] = this.mul(d[e - 1], a);
          }
          var g = d[0], h = 0, i = 0, j = b.bitLength() % 26;
          for (0 === j && (j = 26), e = b.length - 1; e >= 0; e--) {
            for (var k = b.words[e], l = j - 1; l >= 0; l--) {
              var m = k >> l & 1;
              g !== d[0] && (g = this.sqr(g)), 0 !== m || 0 !== h
                  ? (h <<= 1, h |= m, i++ , (i === c || 0 === e && 0 === l)
                  && (g = this.mul(g, d[h]), i = 0, h = 0)) : i = 0
            }
            j = 26
          }
          return g
        }, s.prototype.convertTo = function (a) {
          var b = a.umod(this.m);
          return b === a ? b.clone() : b
        }, s.prototype.convertFrom = function (a) {
          var b = a.clone();
          return b.red = null, b
        }, f.mont = function (a) {
          return new t(a)
        }, e(t, s), t.prototype.convertTo = function (a) {
          return this.imod(a.ushln(this.shift))
        }, t.prototype.convertFrom = function (a) {
          var b = this.imod(a.mul(this.rinv));
          return b.red = null, b
        }, t.prototype.imul = function (a, b) {
          if (a.isZero() || b.isZero()) {
            return a.words[0] = 0, a.length = 1, a;
          }
          var c = a.imul(b),
              d = c.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(
                  this.m), e = c.isub(d).iushrn(this.shift), f = e;
          return e.cmp(this.m) >= 0 ? f = e.isub(this.m) : e.cmpn(0) < 0
              && (f = e.iadd(this.m)), f._forceRed(this)
        }, t.prototype.mul = function (a, b) {
          if (a.isZero() || b.isZero()) {
            return new f(0)._forceRed(this);
          }
          var c = a.mul(b),
              d = c.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(
                  this.m), e = c.isub(d).iushrn(this.shift), g = e;
          return e.cmp(this.m) >= 0 ? g = e.isub(this.m) : e.cmpn(0) < 0
              && (g = e.iadd(this.m)), g._forceRed(this)
        }, t.prototype.invm = function (a) {
          var b = this.imod(a._invmp(this.m).mul(this.r2));
          return b._forceRed(this)
        }
      }("undefined" == typeof b || b, this)
    }, {}],
    17: [function (a, b, c) {
      function d(a) {
        this.rand = a
      }

      var e;
      if (b.exports = function (a) {
            return e || (e = new d(null)), e.generate(a)
          }, b.exports.Rand = d, d.prototype.generate = function (a) {
            return this._rand(a)
          }, "object" == typeof self) {
        self.crypto && self.crypto.getRandomValues
            ? d.prototype._rand = function (a) {
              var b = new Uint8Array(a);
              return self.crypto.getRandomValues(b), b
            } : self.msCrypto && self.msCrypto.getRandomValues
            ? d.prototype._rand = function (a) {
              var b = new Uint8Array(a);
              return self.msCrypto.getRandomValues(b), b
            } : d.prototype._rand = function () {
              throw new Error("Not implemented yet")
            };
      } else {
        try {
          var f = a("crypto");
          d.prototype._rand = function (a) {
            return f.randomBytes(a)
          }
        } catch (g) {
          d.prototype._rand = function (a) {
            for (var b = new Uint8Array(a), c = 0; c < b.length;
                c++) {
              b[c] = this.rand.getByte();
            }
            return b
          }
        }
      }
    }, {crypto: 18}],
    18: [function (a, b, c) {
    }, {}],
    19: [function (a, b, c) {
      var d = c;
      d.utils = a("./hash/utils"), d.common = a("./hash/common"), d.sha = a(
          "./hash/sha"), d.ripemd = a("./hash/ripemd"), d.hmac = a(
          "./hash/hmac"), d.sha1 = d.sha.sha1, d.sha256 = d.sha.sha256, d.sha224 = d.sha.sha224, d.sha384 = d.sha.sha384, d.sha512 = d.sha.sha512, d.ripemd160 = d.ripemd.ripemd160
    }, {
      "./hash/common": 20,
      "./hash/hmac": 21,
      "./hash/ripemd": 22,
      "./hash/sha": 23,
      "./hash/utils": 24
    }],
    20: [function (a, b, c) {
      function d() {
        this.pending = null, this.pendingTotal = 0, this.blockSize = this.constructor.blockSize, this.outSize = this.constructor.outSize, this.hmacStrength = this.constructor.hmacStrength, this.padLength = this.constructor.padLength
            / 8, this.endian = "big", this._delta8 = this.blockSize
            / 8, this._delta32 = this.blockSize / 32
      }

      var e = a("../hash"), f = e.utils, g = f.assert;
      c.BlockHash = d, d.prototype.update = function (a, b) {
        if (a = f.toArray(a, b), this.pending
                ? this.pending = this.pending.concat(a)
                : this.pending = a, this.pendingTotal += a.length, this.pending.length
            >= this._delta8) {
          a = this.pending;
          var c = a.length % this._delta8;
          this.pending = a.slice(a.length - c, a.length), 0
          === this.pending.length && (this.pending = null), a = f.join32(a,
              0, a.length - c, this.endian);
          for (var d = 0; d < a.length; d += this._delta32) {
            this._update(a, d, d
                + this._delta32)
          }
        }
        return this
      }, d.prototype.digest = function (a) {
        return this.update(this._pad()), g(null === this.pending), this._digest(
            a)
      }, d.prototype._pad = function () {
        var a = this.pendingTotal, b = this._delta8,
            c = b - (a + this.padLength) % b, d = new Array(c + this.padLength);
        d[0] = 128;
        for (var e = 1; e < c; e++) {
          d[e] = 0;
        }
        if (a <<= 3, "big" === this.endian) {
          for (var f = 8; f < this.padLength; f++) {
            d[e++] = 0;
          }
          d[e++] = 0, d[e++] = 0, d[e++] = 0, d[e++] = 0, d[e++] = a >>> 24
              & 255, d[e++] = a >>> 16 & 255, d[e++] = a >>> 8
              & 255, d[e++] = 255 & a
        } else {
          d[e++] = 255 & a, d[e++] = a >>> 8 & 255, d[e++] = a >>> 16
              & 255, d[e++] = a >>> 24
              & 255, d[e++] = 0, d[e++] = 0, d[e++] = 0, d[e++] = 0;
          for (var f = 8; f < this.padLength; f++) {
            d[e++] = 0
          }
        }
        return d
      }
    }, {"../hash": 19}],
    21: [function (a, b, c) {
      function d(a, b, c) {
        return this instanceof d ? (this.Hash = a, this.blockSize = a.blockSize
            / 8, this.outSize = a.outSize
            / 8, this.inner = null, this.outer = null, void this._init(
            f.toArray(b, c))) : new d(a, b, c)
      }

      var e = a("../hash"), f = e.utils, g = f.assert;
      b.exports = d, d.prototype._init = function (a) {
        a.length > this.blockSize && (a = (new this.Hash).update(
            a).digest()), g(a.length <= this.blockSize);
        for (var b = a.length; b < this.blockSize; b++) {
          a.push(0);
        }
        for (var b = 0; b < a.length; b++) {
          a[b] ^= 54;
        }
        this.inner = (new this.Hash).update(a);
        for (var b = 0; b < a.length; b++) {
          a[b] ^= 106;
        }
        this.outer = (new this.Hash).update(a)
      }, d.prototype.update = function (a, b) {
        return this.inner.update(a, b), this
      }, d.prototype.digest = function (a) {
        return this.outer.update(this.inner.digest()), this.outer.digest(a)
      }
    }, {"../hash": 19}],
    22: [function (a, b, c) {
      function d() {
        return this instanceof d ? (n.call(this), this.h = [1732584193,
          4023233417, 2562383102, 271733878,
          3285377520], void (this.endian = "little")) : new d
      }

      function e(a, b, c, d) {
        return a <= 15 ? b ^ c ^ d : a <= 31 ? b & c | ~b & d : a <= 47 ? (b
            | ~c) ^ d : a <= 63 ? b & d | c & ~d : b ^ (c | ~d)
      }

      function f(a) {
        return a <= 15 ? 0 : a <= 31 ? 1518500249 : a <= 47 ? 1859775393 : a
        <= 63 ? 2400959708 : 2840853838
      }

      function g(a) {
        return a <= 15 ? 1352829926 : a <= 31 ? 1548603684 : a <= 47
            ? 1836072691 : a <= 63 ? 2053994217 : 0
      }

      var h = a("../hash"), i = h.utils, j = i.rotl32, k = i.sum32,
          l = i.sum32_3, m = i.sum32_4, n = h.common.BlockHash;
      i.inherits(d,
          n), c.ripemd160 = d, d.blockSize = 512, d.outSize = 160, d.hmacStrength = 192, d.padLength = 64, d.prototype._update = function (a,
          b) {
        for (var c = this.h[0], d = this.h[1], h = this.h[2], i = this.h[3],
            n = this.h[4], s = c, t = d, u = h, v = i, w = n, x = 0; x < 80;
            x++) {
          var y = k(j(m(c, e(x, d, h, i), a[o[x] + b], f(x)), q[x]), n);
          c = n, n = i, i = j(h, 10), h = d, d = y, y = k(
              j(m(s, e(79 - x, t, u, v), a[p[x] + b], g(x)), r[x]),
              w), s = w, w = v, v = j(u, 10), u = t, t = y
        }
        y = l(this.h[1], h, v), this.h[1] = l(this.h[2], i, w), this.h[2] = l(
            this.h[3], n, s), this.h[3] = l(this.h[4], c, t), this.h[4] = l(
            this.h[0], d, u), this.h[0] = y
      }, d.prototype._digest = function (a) {
        return "hex" === a ? i.toHex32(this.h, "little") : i.split32(this.h,
            "little")
      };
      var o = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13,
            1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1,
            2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14,
            5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13],
          p = [5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3,
            7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6,
            9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2,
            13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9,
            11],
          q = [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8,
            13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9,
            13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9,
            14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14,
            11, 8, 5, 6],
          r = [8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13,
            15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6,
            6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6,
            9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15,
            13, 11, 11]
    }, {"../hash": 19}],
    23: [function (a, b, c) {
      function d() {
        return this instanceof d ? (V.call(this), this.h = [1779033703,
          3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635,
          1541459225], this.k = W, void (this.W = new Array(64))) : new d
      }

      function e() {
        return this instanceof e ? (d.call(this), void (this.h = [3238371032,
          914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839,
          3204075428])) : new e
      }

      function f() {
        return this instanceof f ? (V.call(this), this.h = [1779033703,
          4089235720, 3144134277, 2227873595, 1013904242, 4271175723,
          2773480762, 1595750129, 1359893119, 2917565137, 2600822924, 725511199,
          528734635, 4215389547, 1541459225,
          327033209], this.k = X, void (this.W = new Array(160))) : new f
      }

      function g() {
        return this instanceof g ? (f.call(this), void (this.h = [3418070365,
          3238371032, 1654270250, 914150663, 2438529370, 812702999, 355462360,
          4144912697, 1731405415, 4290775857, 2394180231, 1750603025,
          3675008525, 1694076839, 1203062813, 3204075428])) : new g
      }

      function h() {
        return this instanceof h ? (V.call(this), this.h = [1732584193,
          4023233417, 2562383102, 271733878,
          3285377520], void (this.W = new Array(80))) : new h
      }

      function i(a, b, c) {
        return a & b ^ ~a & c
      }

      function j(a, b, c) {
        return a & b ^ a & c ^ b & c
      }

      function k(a, b, c) {
        return a ^ b ^ c
      }

      function l(a) {
        return F(a, 2) ^ F(a, 13) ^ F(a, 22)
      }

      function m(a) {
        return F(a, 6) ^ F(a, 11) ^ F(a, 25)
      }

      function n(a) {
        return F(a, 7) ^ F(a, 18) ^ a >>> 3
      }

      function o(a) {
        return F(a, 17) ^ F(a, 19) ^ a >>> 10
      }

      function p(a, b, c, d) {
        return 0 === a ? i(b, c, d) : 1 === a || 3 === a ? k(b, c, d) : 2 === a
            ? j(b, c, d) : void 0
      }

      function q(a, b, c, d, e, f) {
        var g = a & c ^ ~a & e;
        return g < 0 && (g += 4294967296), g
      }

      function r(a, b, c, d, e, f) {
        var g = b & d ^ ~b & f;
        return g < 0 && (g += 4294967296), g
      }

      function s(a, b, c, d, e, f) {
        var g = a & c ^ a & e ^ c & e;
        return g < 0 && (g += 4294967296), g
      }

      function t(a, b, c, d, e, f) {
        var g = b & d ^ b & f ^ d & f;
        return g < 0 && (g += 4294967296), g
      }

      function u(a, b) {
        var c = K(a, b, 28), d = K(b, a, 2), e = K(b, a, 7), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function v(a, b) {
        var c = L(a, b, 28), d = L(b, a, 2), e = L(b, a, 7), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function w(a, b) {
        var c = K(a, b, 14), d = K(a, b, 18), e = K(b, a, 9), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function x(a, b) {
        var c = L(a, b, 14), d = L(a, b, 18), e = L(b, a, 9), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function y(a, b) {
        var c = K(a, b, 1), d = K(a, b, 8), e = M(a, b, 7), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function z(a, b) {
        var c = L(a, b, 1), d = L(a, b, 8), e = N(a, b, 7), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function A(a, b) {
        var c = K(a, b, 19), d = K(b, a, 29), e = M(a, b, 6), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      function B(a, b) {
        var c = L(a, b, 19), d = L(b, a, 29), e = N(a, b, 6), f = c ^ d ^ e;
        return f < 0 && (f += 4294967296), f
      }

      var C = a("../hash"), D = C.utils, E = D.assert, F = D.rotr32,
          G = D.rotl32, H = D.sum32, I = D.sum32_4, J = D.sum32_5,
          K = D.rotr64_hi, L = D.rotr64_lo, M = D.shr64_hi, N = D.shr64_lo,
          O = D.sum64, P = D.sum64_hi, Q = D.sum64_lo, R = D.sum64_4_hi,
          S = D.sum64_4_lo, T = D.sum64_5_hi, U = D.sum64_5_lo,
          V = C.common.BlockHash,
          W = [1116352408, 1899447441, 3049323471, 3921009573, 961987163,
            1508970993, 2453635748, 2870763221, 3624381080, 310598401,
            607225278, 1426881987, 1925078388, 2162078206, 2614888103,
            3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983,
            1249150122, 1555081692, 1996064986, 2554220882, 2821834349,
            2952996808, 3210313671, 3336571891, 3584528711, 113926993,
            338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700,
            1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
            3259730800, 3345764771, 3516065817, 3600352804, 4094571909,
            275423344, 430227734, 506948616, 659060556, 883997877, 958139571,
            1322822218, 1537002063, 1747873779, 1955562222, 2024104815,
            2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
            3329325298],
          X = [1116352408, 3609767458, 1899447441, 602891725, 3049323471,
            3964484399, 3921009573, 2173295548, 961987163, 4081628472,
            1508970993, 3053834265, 2453635748, 2937671579, 2870763221,
            3664609560, 3624381080, 2734883394, 310598401, 1164996542,
            607225278, 1323610764, 1426881987, 3590304994, 1925078388,
            4068182383, 2162078206, 991336113, 2614888103, 633803317,
            3248222580, 3479774868, 3835390401, 2666613458, 4022224774,
            944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983,
            1495990901, 1249150122, 1856431235, 1555081692, 3175218132,
            1996064986, 2198950837, 2554220882, 3999719339, 2821834349,
            766784016, 2952996808, 2566594879, 3210313671, 3203337956,
            3336571891, 1034457026, 3584528711, 2466948901, 113926993,
            3758326383, 338241895, 168717936, 666307205, 1188179964, 773529912,
            1546045734, 1294757372, 1522805485, 1396182291, 2643833823,
            1695183700, 2343527390, 1986661051, 1014477480, 2177026350,
            1206759142, 2456956037, 344077627, 2730485921, 1290863460,
            2820302411, 3158454273, 3259730800, 3505952657, 3345764771,
            106217008, 3516065817, 3606008344, 3600352804, 1432725776,
            4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752,
            506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280,
            958139571, 3318307427, 1322822218, 3812723403, 1537002063,
            2003034995, 1747873779, 3602036899, 1955562222, 1575990012,
            2024104815, 1125592928, 2227730452, 2716904306, 2361852424,
            442776044, 2428436474, 593698344, 2756734187, 3733110249,
            3204031479, 2999351573, 3329325298, 3815920427, 3391569614,
            3928383900, 3515267271, 566280711, 3940187606, 3454069534,
            4118630271, 4000239992, 116418474, 1914138554, 174292421,
            2731055270, 289380356, 3203993006, 460393269, 320620315, 685471733,
            587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580,
            2618297676, 1288033470, 3409855158, 1501505948, 4234509866,
            1607167915, 987167468, 1816402316, 1246189591],
          Y = [1518500249, 1859775393, 2400959708, 3395469782];
      D.inherits(d,
          V), c.sha256 = d, d.blockSize = 512, d.outSize = 256, d.hmacStrength = 192, d.padLength = 64, d.prototype._update = function (a,
          b) {
        for (var c = this.W, d = 0; d < 16; d++) {
          c[d] = a[b + d];
        }
        for (; d < c.length; d++) {
          c[d] = I(o(c[d - 2]), c[d - 7], n(c[d - 15]),
              c[d - 16]);
        }
        var e = this.h[0], f = this.h[1], g = this.h[2], h = this.h[3],
            k = this.h[4], p = this.h[5], q = this.h[6], r = this.h[7];
        E(this.k.length === c.length);
        for (var d = 0; d < c.length; d++) {
          var s = J(r, m(k), i(k, p, q), this.k[d], c[d]),
              t = H(l(e), j(e, f, g));
          r = q, q = p, p = k, k = H(h, s), h = g, g = f, f = e, e = H(s, t)
        }
        this.h[0] = H(this.h[0], e), this.h[1] = H(this.h[1], f), this.h[2] = H(
            this.h[2], g), this.h[3] = H(this.h[3], h), this.h[4] = H(this.h[4],
            k), this.h[5] = H(this.h[5], p), this.h[6] = H(this.h[6],
            q), this.h[7] = H(this.h[7], r)
      }, d.prototype._digest = function (a) {
        return "hex" === a ? D.toHex32(this.h, "big") : D.split32(this.h, "big")
      }, D.inherits(e,
          d), c.sha224 = e, e.blockSize = 512, e.outSize = 224, e.hmacStrength = 192, e.padLength = 64, e.prototype._digest = function (a) {
        return "hex" === a ? D.toHex32(this.h.slice(0, 7), "big") : D.split32(
            this.h.slice(0, 7), "big")
      }, D.inherits(f,
          V), c.sha512 = f, f.blockSize = 1024, f.outSize = 512, f.hmacStrength = 192, f.padLength = 128, f.prototype._prepareBlock = function (a,
          b) {
        for (var c = this.W, d = 0; d < 32; d++) {
          c[d] = a[b + d];
        }
        for (; d < c.length; d += 2) {
          var e = A(c[d - 4], c[d - 3]), f = B(c[d - 4], c[d - 3]),
              g = c[d - 14], h = c[d - 13], i = y(c[d - 30], c[d - 29]),
              j = z(c[d - 30], c[d - 29]), k = c[d - 32], l = c[d - 31];
          c[d] = R(e, f, g, h, i, j, k, l), c[d + 1] = S(e, f, g, h, i, j, k, l)
        }
      }, f.prototype._update = function (a, b) {
        this._prepareBlock(a, b);
        var c = this.W, d = this.h[0], e = this.h[1], f = this.h[2],
            g = this.h[3], h = this.h[4], i = this.h[5], j = this.h[6],
            k = this.h[7], l = this.h[8], m = this.h[9], n = this.h[10],
            o = this.h[11], p = this.h[12], y = this.h[13], z = this.h[14],
            A = this.h[15];
        E(this.k.length === c.length);
        for (var B = 0; B < c.length; B += 2) {
          var C = z, D = A, F = w(l, m), G = x(l, m), H = q(l, m, n, o, p, y),
              I = r(l, m, n, o, p, y), J = this.k[B], K = this.k[B + 1],
              L = c[B], M = c[B + 1], N = T(C, D, F, G, H, I, J, K, L, M),
              R = U(C, D, F, G, H, I, J, K, L, M), C = u(d, e), D = v(d, e),
              F = s(d, e, f, g, h, i), G = t(d, e, f, g, h, i),
              S = P(C, D, F, G), V = Q(C, D, F, G);
          z = p, A = y, p = n, y = o, n = l, o = m, l = P(j, k, N, R), m = Q(k,
              k, N, R), j = h, k = i, h = f, i = g, f = d, g = e, d = P(N, R, S,
              V), e = Q(N, R, S, V)
        }
        O(this.h, 0, d, e), O(this.h, 2, f, g), O(this.h, 4, h, i), O(this.h, 6,
            j, k), O(this.h, 8, l, m), O(this.h, 10, n, o), O(this.h, 12, p,
            y), O(this.h, 14, z, A)
      }, f.prototype._digest = function (a) {
        return "hex" === a ? D.toHex32(this.h, "big") : D.split32(this.h, "big")
      }, D.inherits(g,
          f), c.sha384 = g, g.blockSize = 1024, g.outSize = 384, g.hmacStrength = 192, g.padLength = 128, g.prototype._digest = function (a) {
        return "hex" === a ? D.toHex32(this.h.slice(0, 12), "big") : D.split32(
            this.h.slice(0, 12), "big")
      }, D.inherits(h,
          V), c.sha1 = h, h.blockSize = 512, h.outSize = 160, h.hmacStrength = 80, h.padLength = 64, h.prototype._update = function (a,
          b) {
        for (var c = this.W, d = 0; d < 16; d++) {
          c[d] = a[b + d];
        }
        for (; d < c.length; d++) {
          c[d] = G(c[d - 3] ^ c[d - 8] ^ c[d - 14] ^ c[d
          - 16], 1);
        }
        for (var e = this.h[0], f = this.h[1], g = this.h[2], h = this.h[3],
            i = this.h[4], d = 0; d < c.length; d++) {
          var j = ~~(d / 20), k = J(G(e, 5), p(j, f, g, h), i, c[d], Y[j]);
          i = h, h = g, g = G(f, 30), f = e, e = k
        }
        this.h[0] = H(this.h[0], e), this.h[1] = H(this.h[1], f), this.h[2] = H(
            this.h[2], g), this.h[3] = H(this.h[3], h), this.h[4] = H(this.h[4],
            i)
      }, h.prototype._digest = function (a) {
        return "hex" === a ? D.toHex32(this.h, "big") : D.split32(this.h, "big")
      }
    }, {"../hash": 19}],
    24: [function (a, b, c) {
      function d(a, b) {
        if (Array.isArray(a)) {
          return a.slice();
        }
        if (!a) {
          return [];
        }
        var c = [];
        if ("string" == typeof a) {
          if (b) {
            if ("hex" === b) {
              a = a.replace(/[^a-z0-9]+/gi, ""), a.length % 2 !== 0 && (a = "0"
                  + a);
              for (var d = 0; d < a.length; d += 2) {
                c.push(
                    parseInt(a[d] + a[d + 1], 16))
              }
            }
          } else {
            for (var d = 0; d < a.length; d++) {
              var e = a.charCodeAt(d), f = e >> 8, g = 255 & e;
              f ? c.push(f, g) : c.push(g)
            }
          }
        } else {
          for (var d = 0; d < a.length; d++) {
            c[d] = 0 | a[d];
          }
        }
        return c
      }

      function e(a) {
        for (var b = "", c = 0; c < a.length; c++) {
          b += h(a[c].toString(16));
        }
        return b
      }

      function f(a) {
        var b = a >>> 24 | a >>> 8 & 65280 | a << 8 & 16711680 | (255 & a)
            << 24;
        return b >>> 0
      }

      function g(a, b) {
        for (var c = "", d = 0; d < a.length; d++) {
          var e = a[d];
          "little" === b && (e = f(e)), c += i(e.toString(16))
        }
        return c
      }

      function h(a) {
        return 1 === a.length ? "0" + a : a
      }

      function i(a) {
        return 7 === a.length ? "0" + a : 6 === a.length ? "00" + a : 5
        === a.length ? "000" + a : 4 === a.length ? "0000" + a : 3 === a.length
            ? "00000" + a : 2 === a.length ? "000000" + a : 1 === a.length
                ? "0000000" + a : a
      }

      function j(a, b, c, d) {
        var e = c - b;
        r(e % 4 === 0);
        for (var f = new Array(e / 4), g = 0, h = b; g < f.length;
            g++ , h += 4) {
          var i;
          i = "big" === d ? a[h] << 24 | a[h + 1] << 16 | a[h + 2] << 8 | a[h
          + 3] : a[h + 3] << 24 | a[h + 2] << 16 | a[h + 1] << 8
              | a[h], f[g] = i >>> 0
        }
        return f
      }

      function k(a, b) {
        for (var c = new Array(4 * a.length), d = 0, e = 0; d < a.length;
            d++ , e += 4) {
          var f = a[d];
          "big" === b ? (c[e] = f >>> 24, c[e + 1] = f >>> 16 & 255, c[e
          + 2] = f >>> 8 & 255, c[e + 3] = 255 & f) : (c[e + 3] = f >>> 24, c[e
          + 2] = f >>> 16 & 255, c[e + 1] = f >>> 8 & 255, c[e] = 255 & f)
        }
        return c
      }

      function l(a, b) {
        return a >>> b | a << 32 - b
      }

      function m(a, b) {
        return a << b | a >>> 32 - b
      }

      function n(a, b) {
        return a + b >>> 0
      }

      function o(a, b, c) {
        return a + b + c >>> 0
      }

      function p(a, b, c, d) {
        return a + b + c + d >>> 0
      }

      function q(a, b, c, d, e) {
        return a + b + c + d + e >>> 0
      }

      function r(a, b) {
        if (!a) {
          throw new Error(b || "Assertion failed")
        }
      }

      function s(a, b, c, d) {
        var e = a[b], f = a[b + 1], g = d + f >>> 0,
            h = (g < d ? 1 : 0) + c + e;
        a[b] = h >>> 0, a[b + 1] = g
      }

      function t(a, b, c, d) {
        var e = b + d >>> 0, f = (e < b ? 1 : 0) + a + c;
        return f >>> 0
      }

      function u(a, b, c, d) {
        var e = b + d;
        return e >>> 0
      }

      function v(a, b, c, d, e, f, g, h) {
        var i = 0, j = b;
        j = j + d >>> 0, i += j < b ? 1 : 0, j = j + f >>> 0, i += j < f ? 1
            : 0, j = j + h >>> 0, i += j < h ? 1 : 0;
        var k = a + c + e + g + i;
        return k >>> 0
      }

      function w(a, b, c, d, e, f, g, h) {
        var i = b + d + f + h;
        return i >>> 0
      }

      function x(a, b, c, d, e, f, g, h, i, j) {
        var k = 0, l = b;
        l = l + d >>> 0, k += l < b ? 1 : 0, l = l + f >>> 0, k += l < f ? 1
            : 0, l = l + h >>> 0, k += l < h ? 1 : 0, l = l + j >>> 0, k += l
        < j ? 1 : 0;
        var m = a + c + e + g + i + k;
        return m >>> 0
      }

      function y(a, b, c, d, e, f, g, h, i, j) {
        var k = b + d + f + h + j;
        return k >>> 0
      }

      function z(a, b, c) {
        var d = b << 32 - c | a >>> c;
        return d >>> 0
      }

      function A(a, b, c) {
        var d = a << 32 - c | b >>> c;
        return d >>> 0
      }

      function B(a, b, c) {
        return a >>> c
      }

      function C(a, b, c) {
        var d = a << 32 - c | b >>> c;
        return d >>> 0
      }

      var D = c, E = a("inherits");
      D.toArray = d, D.toHex = e, D.htonl = f, D.toHex32 = g, D.zero2 = h, D.zero8 = i, D.join32 = j, D.split32 = k, D.rotr32 = l, D.rotl32 = m, D.sum32 = n, D.sum32_3 = o, D.sum32_4 = p, D.sum32_5 = q, D.assert = r, D.inherits = E, c.sum64 = s, c.sum64_hi = t, c.sum64_lo = u, c.sum64_4_hi = v, c.sum64_4_lo = w, c.sum64_5_hi = x, c.sum64_5_lo = y, c.rotr64_hi = z, c.rotr64_lo = A, c.shr64_hi = B, c.shr64_lo = C
    }, {inherits: 27}],
    25: [function (a, b, c) {
      "use strict";

      function d(a) {
        if (!(this instanceof d)) {
          return new d(a);
        }
        this.hash = a.hash, this.predResist = !!a.predResist, this.outLen = this.hash.outSize, this.minEntropy = a.minEntropy
            || this.hash.hmacStrength, this.reseed = null, this.reseedInterval = null, this.K = null, this.V = null;
        var b = f.toArray(a.entropy, a.entropyEnc || "hex"),
            c = f.toArray(a.nonce, a.nonceEnc || "hex"),
            e = f.toArray(a.pers, a.persEnc || "hex");
        g(b.length >= this.minEntropy / 8, "Not enough entropy. Minimum is: "
            + this.minEntropy + " bits"), this._init(b, c, e)
      }

      var e = a("hash.js"), f = a("minimalistic-crypto-utils"),
          g = a("minimalistic-assert");
      b.exports = d, d.prototype._init = function (a, b, c) {
        var d = a.concat(b).concat(c);
        this.K = new Array(this.outLen / 8), this.V = new Array(this.outLen
            / 8);
        for (var e = 0; e < this.V.length; e++) {
          this.K[e] = 0, this.V[e] = 1;
        }
        this._update(d), this.reseed = 1, this.reseedInterval = 281474976710656
      }, d.prototype._hmac = function () {
        return new e.hmac(this.hash, this.K)
      }, d.prototype._update = function (a) {
        var b = this._hmac().update(this.V).update([0]);
        a && (b = b.update(
            a)), this.K = b.digest(), this.V = this._hmac().update(
            this.V).digest(), a && (this.K = this._hmac().update(this.V).update(
            [1]).update(a).digest(), this.V = this._hmac().update(
            this.V).digest())
      }, d.prototype.reseed = function (a, b, c, d) {
        "string" != typeof b && (d = c, c = b, b = null), a = f.toArray(a,
            b), c = f.toArray(c, d), g(a.length >= this.minEntropy
            / 8, "Not enough entropy. Minimum is: " + this.minEntropy
            + " bits"), this._update(a.concat(c || [])), this.reseed = 1
      }, d.prototype.generate = function (a, b, c, d) {
        if (this.reseed > this.reseedInterval) {
          throw new Error(
              "Reseed is required");
        }
        "string" != typeof b && (d = c, c = b, b = null), c && (c = f.toArray(
            c, d || "hex"), this._update(c));
        for (var e = []; e.length < a;) {
          this.V = this._hmac().update(
              this.V).digest(), e = e.concat(this.V);
        }
        var g = e.slice(0, a);
        return this._update(c), this.reseed++ , f.encode(g, b)
      }
    }, {
      "hash.js": 19,
      "minimalistic-assert": 28,
      "minimalistic-crypto-utils": 26
    }],
    26: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        if (Array.isArray(a)) {
          return a.slice();
        }
        if (!a) {
          return [];
        }
        var c = [];
        if ("string" != typeof a) {
          for (var d = 0; d < a.length; d++) {
            c[d] = 0 | a[d];
          }
          return c
        }
        if ("hex" === b) {
          a = a.replace(/[^a-z0-9]+/gi, ""), a.length % 2 !== 0 && (a = "0"
              + a);
          for (var d = 0; d < a.length; d += 2) {
            c.push(
                parseInt(a[d] + a[d + 1], 16))
          }
        } else {
          for (var d = 0; d < a.length; d++) {
            var e = a.charCodeAt(d), f = e >> 8, g = 255 & e;
            f ? c.push(f, g) : c.push(g)
          }
        }
        return c
      }

      function e(a) {
        return 1 === a.length ? "0" + a : a
      }

      function f(a) {
        for (var b = "", c = 0; c < a.length; c++) {
          b += e(a[c].toString(16));
        }
        return b
      }

      var g = c;
      g.toArray = d, g.zero2 = e, g.toHex = f, g.encode = function (a, b) {
        return "hex" === b ? f(a) : a
      }
    }, {}],
    27: [function (a, b, c) {
      "function" == typeof Object.create ? b.exports = function (a, b) {
        a.super_ = b, a.prototype = Object.create(b.prototype, {
          constructor: {
            value: a,
            enumerable: !1,
            writable: !0,
            configurable: !0
          }
        })
      } : b.exports = function (a, b) {
        a.super_ = b;
        var c = function () {
        };
        c.prototype = b.prototype, a.prototype = new c, a.prototype.constructor = a
      }
    }, {}],
    28: [function (a, b, c) {
      function d(a, b) {
        if (!a) {
          throw new Error(b || "Assertion failed")
        }
      }

      b.exports = d, d.equal = function (a, b, c) {
        if (a != b) {
          throw new Error(c || "Assertion failed: " + a + " != " + b)
        }
      }
    }, {}],
    29: [function (a, b, c) {
      "use strict";

      function d(a, b) {
        if (Array.isArray(a)) {
          return a.slice();
        }
        if (!a) {
          return [];
        }
        var c = [];
        if ("string" != typeof a) {
          for (var d = 0; d < a.length; d++) {
            c[d] = 0 | a[d];
          }
          return c
        }
        if (b) {
          if ("hex" === b) {
            a = a.replace(/[^a-z0-9]+/gi, ""), a.length % 2 !== 0 && (a = "0"
                + a);
            for (var d = 0; d < a.length; d += 2) {
              c.push(
                  parseInt(a[d] + a[d + 1], 16));
            }
          }
        } else {
          for (var d = 0; d < a.length; d++) {
            var e = a.charCodeAt(d), f = e >> 8, g = 255 & e;
            f ? c.push(f, g) : c.push(g)
          }
        }
        return c
      }

      function e(a) {
        return 1 === a.length ? "0" + a : a
      }

      function f(a) {
        for (var b = "", c = 0; c < a.length; c++) {
          b += e(a[c].toString(16));
        }
        return b
      }

      var g = c;
      g.toArray = d, g.zero2 = e, g.toHex = f, g.encode = function (a, b) {
        return "hex" === b ? f(a) : a
      }
    }, {}],
    30: [function (a, b, c) {
      b.exports = {
        name: "elliptic",
        version: "6.4.0",
        description: "EC cryptography",
        main: "lib/elliptic.js",
        files: ["lib"],
        scripts: {
          jscs: "jscs benchmarks/*.js lib/*.js lib/**/*.js lib/**/**/*.js test/index.js",
          jshint: "jscs benchmarks/*.js lib/*.js lib/**/*.js lib/**/**/*.js test/index.js",
          lint: "npm run jscs && npm run jshint",
          unit: "istanbul test _mocha --reporter=spec test/index.js",
          test: "npm run lint && npm run unit",
          version: "grunt dist && git add dist/"
        },
        repository: {type: "git", url: "git@github.com:indutny/elliptic"},
        keywords: ["EC", "Elliptic", "curve", "Cryptography"],
        author: "Fedor Indutny <fedor@indutny.com>",
        license: "MIT",
        bugs: {url: "https://github.com/indutny/elliptic/issues"},
        homepage: "https://github.com/indutny/elliptic",
        devDependencies: {
          brfs: "^1.4.3",
          coveralls: "^2.11.3",
          grunt: "^0.4.5",
          "grunt-browserify": "^5.0.0",
          "grunt-cli": "^1.2.0",
          "grunt-contrib-connect": "^1.0.0",
          "grunt-contrib-copy": "^1.0.0",
          "grunt-contrib-uglify": "^1.0.1",
          "grunt-mocha-istanbul": "^3.0.1",
          "grunt-saucelabs": "^8.6.2",
          istanbul: "^0.4.2",
          jscs: "^2.9.0",
          jshint: "^2.6.0",
          mocha: "^2.1.0"
        },
        dependencies: {
          "bn.js": "^4.4.0",
          brorand: "^1.0.1",
          "hash.js": "^1.0.0",
          "hmac-drbg": "^1.0.0",
          inherits: "^2.0.1",
          "minimalistic-assert": "^1.0.0",
          "minimalistic-crypto-utils": "^1.0.0"
        }
      }
    }, {}]
  }, {}, [1])(1)
});

function Base64() {

  // private property
  var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  // public method for encoding
  this.encode = function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    //    input = _utf8_encode(input);
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output +
          _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
          _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
    }
    return output;
  }

  // public method for encoding
  this.encodeIgnoreUtf8 = function (inputBytes) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    //    input = _utf8_encode(input);
    while (i < inputBytes.length) {
      chr1 = inputBytes[i++];
      chr2 = inputBytes[i++];
      chr3 = inputBytes[i++];
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output +
          _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
          _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
    }
    return output;
  }

  // public method for decoding
  this.decode = function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
      enc1 = _keyStr.indexOf(input.charAt(i++));
      enc2 = _keyStr.indexOf(input.charAt(i++));
      enc3 = _keyStr.indexOf(input.charAt(i++));
      enc4 = _keyStr.indexOf(input.charAt(i++));
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
    }
    output = _utf8_decode(output);
    return output;
  }

  // public method for decoding
  this.decodeToByteArray = function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < input.length) {
      enc1 = _keyStr.indexOf(input.charAt(i++));
      enc2 = _keyStr.indexOf(input.charAt(i++));
      enc3 = _keyStr.indexOf(input.charAt(i++));
      enc4 = _keyStr.indexOf(input.charAt(i++));
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
    }
    var outBytes = _out2ByteArray(output);
    return outBytes;
  }

  // private method for UTF-8 decoding
  _out2ByteArray = function (utftext) {
    var byteArray = new Array(utftext.length)
    var i = 0;
    var c = c1 = c2 = 0;
    while (i < utftext.length) {
      c = utftext.charCodeAt(i);
      byteArray[i] = c;
      i++;
    }
    return byteArray;
  }

  // private method for UTF-8 encoding
  _utf8_encode = function (string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }
    return utftext;
  }

  // private method for UTF-8 decoding
  _utf8_decode = function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;
    while (i < utftext.length) {
      c = utftext.charCodeAt(i);
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if ((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3
            & 63));
        i += 3;
      }
    }
    return string;
  }
}

//å­—ç¬¦ä¸²è½¬byteArrayæ•°æ®æ ¼å¼
function stringToBytes(str) {
  var bytes = new Array();
  var len, c;
  len = str.length;
  for (var i = 0; i < len; i++) {
    c = str.charCodeAt(i);
    if (c >= 0x010000 && c <= 0x10FFFF) {
      bytes.push(((c >> 18) & 0x07) | 0xF0);
      bytes.push(((c >> 12) & 0x3F) | 0x80);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000800 && c <= 0x00FFFF) {
      bytes.push(((c >> 12) & 0x0F) | 0xE0);
      bytes.push(((c >> 6) & 0x3F) | 0x80);
      bytes.push((c & 0x3F) | 0x80);
    } else if (c >= 0x000080 && c <= 0x0007FF) {
      bytes.push(((c >> 6) & 0x1F) | 0xC0);
      bytes.push((c & 0x3F) | 0x80);
    } else {
      bytes.push(c & 0xFF);
    }
  }
  return bytes;

}

//byteArrayæ•°æ®æ ¼å¼è½¬å­—ç¬¦ä¸²
function bytesToString(arr) {
  if (typeof arr === 'string') {
    return arr;
  }
  var str = '',
      _arr = arr;
  for (var i = 0; i < _arr.length; i++) {
    var one = _arr[i].toString(2),
        v = one.match(/^1+?(?=0)/);
    if (v && one.length == 8) {
      var bytesLength = v[0].length;
      var store = _arr[i].toString(2).slice(7 - bytesLength);
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2);
      }
      str += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1;
    } else {
      str += String.fromCharCode(_arr[i]);
    }
  }
  return str;
}

/* Convert a hex char to value */
function hexChar2byte(c) {
  var d = 0;
  if (c >= 'A' && c <= 'F') {
    d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  }
  else if (c >= 'a' && c <= 'f') {
    d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
  }
  else if (c >= '0' && c <= '9') {
    d = c.charCodeAt(0) - '0'.charCodeAt(0);
  }
  return d;
}

/* Check if a char is hex char */
function isHexChar(c) {
  if ((c >= 'A' && c <= 'F') ||
      (c >= 'a' && c <= 'f') ||
      (c >= '0' && c <= '9')) {
    return 1;
  }
  return 0;
}

/* Convert HEX string to byte array */

//16è¿›åˆ¶çš„ASCIIå­—ç¬¦ä¸²è½¬ä¸ºbyteArrayæ ¼å¼ã€‚
function hexStr2byteArray(str) {
  var byteArray = Array();
  var d = 0;
  var i = 0;
  var j = 0;
  var k = 0;

  for (i = 0; i < str.length; i++) {
    var c = str.charAt(i);
    if (isHexChar(c)) {
      d <<= 4;
      d += hexChar2byte(c);
      j++;
      if (0 == (j % 2)) {
        byteArray[k++] = d;
        d = 0;
      }
    }
  }
  return byteArray;
}

/* Convert a byte to string */
function byte2hexStr(byte) {
  var hexByteMap = "0123456789ABCDEF";
  var str = "";
  str += hexByteMap.charAt(byte >> 4);
  str += hexByteMap.charAt(byte & 0x0f);
  return str;
}

/* Convert byte arry to HEX string */

//byteArrayæ ¼å¼æ•°æ®è½¬ä¸º16è¿›åˆ¶çš„ASCIIå­—ç¬¦ä¸²ã€‚
function byteArray2hexStr(byteArray) {
  var str = "";
  for (var i = 0; i < (byteArray.length - 1); i++) {
    str += byte2hexStr(byteArray[i]);
  }
  str += byte2hexStr(byteArray[i]);
  return str;
}

//return baset64 String
//å°†byteArrayæ ¼å¼æ•°æ®ç¼–ç ä¸ºbase64å­—ç¬¦ä¸²
function base64EncodeToString(bytes) {
  // var string = bytesToString(bytes);
  var b = new Base64();
  var string64 = b.encodeIgnoreUtf8(bytes);
  return string64
}

//ä»Žbase64å­—ç¬¦ä¸²ä¸­è§£ç å‡ºåŽŸæ–‡ï¼Œæ ¼å¼ä¸ºbyteArrayæ ¼å¼
function base64DecodeFromString(string64) {
  var b = new Base64();
  var decodeBytes = b.decodeToByteArray(string64);
  //  var decodeBytes = stringToBytes(decodeString);
  return decodeBytes;
}

var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
var ALPHABET_MAP = {}
for (var i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i
}
var BASE = 58

function encode58(buffer) {
  if (buffer.length === 0) {
    return ''
  }

  var i, j, digits = [0]
  for (i = 0; i < buffer.length; i++) {
    for (j = 0; j < digits.length; j++) {
      digits[j] <<= 8
    }

    digits[0] += buffer[i]

    var carry = 0
    for (j = 0; j < digits.length; ++j) {
      digits[j] += carry

      carry = (digits[j] / BASE) | 0
      digits[j] %= BASE
    }

    while (carry) {
      digits.push(carry % BASE)

      carry = (carry / BASE) | 0
    }
  }

  // deal with leading zeros
  for (i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    digits.push(0)
  }

  return digits.reverse().map(function (digit) {
    return ALPHABET[digit]
  }).join('')
}

function decode58(string) {
  if (string.length === 0) {
    return []
  }

  var i, j, bytes = [0]
  for (i = 0; i < string.length; i++) {
    var c = string[i]
    if (!(c in ALPHABET_MAP)) {
      throw new Error('Non-base58 character')
    }

    for (j = 0; j < bytes.length; j++) {
      bytes[j] *= BASE
    }
    bytes[0] += ALPHABET_MAP[c]

    var carry = 0
    for (j = 0; j < bytes.length; ++j) {
      bytes[j] += carry

      carry = bytes[j] >> 8
      bytes[j] &= 0xff
    }

    while (carry) {
      bytes.push(carry & 0xff)

      carry >>= 8
    }
  }

  // deal with leading zeros
  for (i = 0; string[i] === '1' && i < string.length - 1; i++) {
    bytes.push(0)
  }

  return bytes.reverse()
}

/*
A JavaScript implementation of the SHA family of hashes, as
defined in FIPS PUB 180-4 and FIPS PUB 202, as well as the corresponding
HMAC implementation as defined in FIPS PUB 198a

Copyright Brian Turek 2008-2017
Distributed under the BSD License
See http://caligatio.github.com/jsSHA/ for more information

Several functions taken from Paul Johnston
*/
'use strict';
(function (I) {
  function w(c, a, d) {
    var l = 0, b = [], g = 0, f, n, k, e, h, q, y, p, m = !1, t = [], r = [], u,
        z = !1;
    d = d || {};
    f = d.encoding || "UTF8";
    u = d.numRounds || 1;
    if (u !== parseInt(u, 10) || 1 > u) {
      throw Error(
          "numRounds must a integer >= 1");
    }
    if (0 === c.lastIndexOf("SHA-", 0)) {
      if (q = function (b, a) {
            return A(b, a, c)
          }, y = function (b, a, l, f) {
            var g, e;
            if ("SHA-224" === c || "SHA-256" === c) {
              g = (a + 65 >>> 9 << 4)
                  + 15, e = 16;
            } else {
              throw Error(
                  "Unexpected error in SHA-2 implementation");
            }
            for (; b.length <= g;) {
              b.push(0);
            }
            b[a >>> 5] |= 128 << 24 - a % 32;
            a = a + l;
            b[g] = a & 4294967295;
            b[g - 1] = a / 4294967296 | 0;
            l = b.length;
            for (a = 0; a < l; a += e) {
              f = A(b.slice(a, a + e), f, c);
            }
            if ("SHA-224" === c) {
              b = [f[0], f[1], f[2], f[3], f[4], f[5],
                f[6]];
            } else if ("SHA-256" === c) {
              b = f;
            } else {
              throw Error(
                  "Unexpected error in SHA-2 implementation");
            }
            return b
          }, p = function (b) {
            return b.slice()
          }, "SHA-224" === c) {
        h = 512, e = 224;
      } else if ("SHA-256"
          === c) {
        h = 512, e = 256;
      } else {
        throw Error(
            "Chosen SHA variant is not supported");
      }
    } else {
      throw Error(
          "Chosen SHA variant is not supported");
    }
    k = B(a, f);
    n = x(c);
    this.setHMACKey = function (b, a, g) {
      var e;
      if (!0 === m) {
        throw Error("HMAC key already set");
      }
      if (!0 === z) {
        throw Error("Cannot set HMAC key after calling update");
      }
      f = (g || {}).encoding || "UTF8";
      a = B(a, f)(b);
      b = a.binLen;
      a = a.value;
      e = h >>> 3;
      g = e / 4 - 1;
      if (e < b / 8) {
        for (a = y(a, b, 0, x(c)); a.length <= g;) {
          a.push(0);
        }
        a[g] &= 4294967040
      } else if (e > b / 8) {
        for (; a.length <= g;) {
          a.push(0);
        }
        a[g] &= 4294967040
      }
      for (b = 0; b <= g; b += 1) {
        t[b] = a[b] ^ 909522486, r[b] = a[b]
            ^ 1549556828;
      }
      n = q(t, n);
      l = h;
      m = !0
    };
    this.update = function (a) {
      var c, f, e, d = 0, p = h >>> 5;
      c = k(a, b, g);
      a = c.binLen;
      f = c.value;
      c = a >>> 5;
      for (e = 0; e < c; e += p) {
        d + h <= a && (n = q(f.slice(e, e + p),
            n), d += h);
      }
      l += d;
      b = f.slice(d >>>
          5);
      g = a % h;
      z = !0
    };
    this.getHash = function (a, f) {
      var d, h, k, q;
      if (!0 === m) {
        throw Error("Cannot call getHash after setting HMAC key");
      }
      k = C(f);
      switch (a) {
        case "HEX":
          d = function (a) {
            return D(a, e, k)
          };
          break;
        case "B64":
          d = function (a) {
            return E(a, e, k)
          };
          break;
        case "BYTES":
          d = function (a) {
            return F(a, e)
          };
          break;
        case "ARRAYBUFFER":
          try {
            h = new ArrayBuffer(0)
          } catch (v) {
            throw Error("ARRAYBUFFER not supported by this environment");
          }
          d = function (a) {
            return G(a, e)
          };
          break;
        default:
          throw Error("format must be HEX, B64, BYTES, or ARRAYBUFFER");
      }
      q = y(b.slice(), g, l, p(n));
      for (h = 1; h < u; h += 1) {
        q = y(q, e, 0, x(c));
      }
      return d(q)
    };
    this.getHMAC = function (a, f) {
      var d, k, t, u;
      if (!1 === m) {
        throw Error(
            "Cannot call getHMAC without first setting HMAC key");
      }
      t = C(f);
      switch (a) {
        case "HEX":
          d = function (a) {
            return D(a, e, t)
          };
          break;
        case "B64":
          d = function (a) {
            return E(a, e, t)
          };
          break;
        case "BYTES":
          d = function (a) {
            return F(a, e)
          };
          break;
        case "ARRAYBUFFER":
          try {
            d = new ArrayBuffer(0)
          } catch (v) {
            throw Error("ARRAYBUFFER not supported by this environment");
          }
          d = function (a) {
            return G(a, e)
          };
          break;
        default:
          throw Error("outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER");
      }
      k = y(b.slice(), g, l, p(n));
      u = q(r, x(c));
      u = y(k, e, h, u);
      return d(u)
    }
  }

  function m() {
  }

  function D(c, a, d) {
    var l = "";
    a /= 8;
    var b, g;
    for (b = 0; b < a; b += 1) {
      g = c[b >>> 2] >>> 8 * (3 + b % 4
          * -1), l += "0123456789abcdef".charAt(g >>> 4 & 15)
          + "0123456789abcdef".charAt(g & 15);
    }
    return d.outputUpper ? l.toUpperCase() : l
  }

  function E(c, a, d) {
    var l = "", b = a / 8, g, f, n;
    for (g = 0; g < b; g += 3) {
      for (f = g + 1 < b ? c[g + 1 >>> 2] : 0, n = g
      + 2 < b ? c[g + 2 >>> 2] : 0, n = (c[g >>> 2] >>> 8 * (3 + g % 4 * -1)
          & 255) << 16 | (f >>> 8 * (3 + (g + 1) % 4 * -1) & 255) << 8 | n >>> 8
          * (3 + (g + 2) % 4 * -1) & 255, f = 0; 4 > f; f += 1) {
        8 * g + 6 * f <= a
            ? l += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(n
            >>>
            6 * (3 - f) & 63) : l += d.b64Pad;
      }
    }
    return l
  }

  function F(c, a) {
    var d = "", l = a / 8, b, g;
    for (b = 0; b < l; b += 1) {
      g = c[b >>> 2] >>> 8 * (3 + b % 4 * -1)
          & 255, d += String.fromCharCode(g);
    }
    return d
  }

  function G(c, a) {
    var d = a / 8, l, b = new ArrayBuffer(d), g;
    g = new Uint8Array(b);
    for (l = 0; l < d; l += 1) {
      g[l] = c[l >>> 2] >>> 8 * (3 + l % 4 * -1) & 255;
    }
    return b
  }

  function C(c) {
    var a = {outputUpper: !1, b64Pad: "=", shakeLen: -1};
    c = c || {};
    a.outputUpper = c.outputUpper || !1;
    !0 === c.hasOwnProperty("b64Pad") && (a.b64Pad = c.b64Pad);
    if ("boolean" !== typeof a.outputUpper) {
      throw Error(
          "Invalid outputUpper formatting option");
    }
    if ("string" !== typeof a.b64Pad) {
      throw Error(
          "Invalid b64Pad formatting option");
    }
    return a
  }

  function B(c, a) {
    var d;
    switch (a) {
      case "UTF8":
      case "UTF16BE":
      case "UTF16LE":
        break;
      default:
        throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");
    }
    switch (c) {
      case "HEX":
        d = function (a, b, c) {
          var f = a.length, d, k, e, h, q;
          if (0 !== f % 2) {
            throw Error(
                "String of HEX type must be in byte increments");
          }
          b = b || [0];
          c = c || 0;
          q = c >>> 3;
          for (d = 0; d < f; d += 2) {
            k = parseInt(a.substr(d, 2), 16);
            if (isNaN(k)) {
              throw Error(
                  "String of HEX type contains invalid characters");
            }
            h = (d >>> 1) + q;
            for (e = h >>> 2; b.length <= e;) {
              b.push(0);
            }
            b[e] |= k << 8 * (3 + h % 4 * -1)
          }
          return {value: b, binLen: 4 * f + c}
        };
        break;
      case "TEXT":
        d = function (c, b, d) {
          var f, n, k = 0, e, h, q, m, p, r;
          b = b || [0];
          d = d || 0;
          q = d >>> 3;
          if ("UTF8" === a) {
            for (r = 3, e = 0; e < c.length;
                e += 1) {
              for (f = c.charCodeAt(e), n = [], 128 > f ? n.push(f)
                  : 2048 > f ? (n.push(192 | f >>> 6), n.push(128 | f & 63))
                      : 55296 > f || 57344 <= f ? n.push(224 | f >>> 12, 128 | f
                          >>> 6 & 63, 128 | f & 63) : (e += 1, f = 65536 + ((f
                          & 1023) << 10 | c.charCodeAt(e) & 1023), n.push(240
                          | f
                          >>> 18, 128 | f >>> 12 & 63, 128 | f >>> 6 & 63, 128
                          | f
                          & 63)), h = 0; h < n.length; h += 1) {
                p = k +
                    q;
                for (m = p >>> 2; b.length <= m;) {
                  b.push(0);
                }
                b[m] |= n[h] << 8 * (r + p % 4 * -1);
                k += 1
              }
            }
          } else if ("UTF16BE" === a || "UTF16LE"
              === a) {
            for (r = 2, n = "UTF16LE" === a && !0 || "UTF16LE" !== a
                && !1, e = 0; e < c.length; e += 1) {
              f = c.charCodeAt(e);
              !0 === n && (h = f & 255, f = h << 8 | f >>> 8);
              p = k + q;
              for (m = p >>> 2; b.length <= m;) {
                b.push(0);
              }
              b[m] |= f << 8 * (r + p % 4 * -1);
              k += 2
            }
          }
          return {value: b, binLen: 8 * k + d}
        };
        break;
      case "B64":
        d = function (a, b, c) {
          var f = 0, d, k, e, h, q, m, p;
          if (-1 === a.search(/^[a-zA-Z0-9=+\/]+$/)) {
            throw Error(
                "Invalid character in base-64 string");
          }
          k = a.indexOf("=");
          a = a.replace(/\=/g,
              "");
          if (-1 !== k && k < a.length) {
            throw Error(
                "Invalid '=' found in base-64 string");
          }
          b = b || [0];
          c = c || 0;
          m = c >>> 3;
          for (k = 0; k < a.length; k += 4) {
            q = a.substr(k, 4);
            for (e = h = 0; e < q.length;
                e += 1) {
              d = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(
                  q[e]), h |= d << 18 - 6 * e;
            }
            for (e = 0; e < q.length - 1; e += 1) {
              p = f + m;
              for (d = p >>> 2; b.length <= d;) {
                b.push(0);
              }
              b[d] |= (h >>> 16 - 8 * e & 255) << 8 * (3 + p % 4 * -1);
              f += 1
            }
          }
          return {value: b, binLen: 8 * f + c}
        };
        break;
      case "BYTES":
        d = function (a, b, c) {
          var d, n, k, e, h;
          b = b || [0];
          c = c || 0;
          k = c >>> 3;
          for (n = 0; n < a.length; n +=
              1) {
            d = a.charCodeAt(n), h = n + k, e = h >>> 2, b.length <= e
            && b.push(0), b[e] |= d << 8 * (3 + h % 4 * -1);
          }
          return {value: b, binLen: 8 * a.length + c}
        };
        break;
      case "ARRAYBUFFER":
        try {
          d = new ArrayBuffer(0)
        } catch (l) {
          throw Error("ARRAYBUFFER not supported by this environment");
        }
        d = function (a, b, c) {
          var d, n, k, e, h;
          b = b || [0];
          c = c || 0;
          n = c >>> 3;
          h = new Uint8Array(a);
          for (d = 0; d < a.byteLength; d += 1) {
            e = d + n, k = e >>> 2, b.length
            <= k && b.push(0), b[k] |= h[d] << 8 * (3 + e % 4 * -1);
          }
          return {value: b, binLen: 8 * a.byteLength + c}
        };
        break;
      default:
        throw Error("format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER");
    }
    return d
  }

  function r(c, a) {
    return c >>> a | c << 32 - a
  }

  function J(c, a, d) {
    return c & a ^ ~c & d
  }

  function K(c, a, d) {
    return c & a ^ c & d ^ a & d
  }

  function L(c) {
    return r(c, 2) ^ r(c, 13) ^ r(c, 22)
  }

  function M(c) {
    return r(c, 6) ^ r(c, 11) ^ r(c, 25)
  }

  function N(c) {
    return r(c, 7) ^ r(c, 18) ^ c >>> 3
  }

  function O(c) {
    return r(c, 17) ^ r(c, 19) ^ c >>> 10
  }

  function P(c, a) {
    var d = (c & 65535) + (a & 65535);
    return ((c >>> 16) + (a >>> 16) + (d >>> 16) & 65535) << 16 | d & 65535
  }

  function Q(c, a, d, l) {
    var b = (c & 65535) + (a & 65535) + (d & 65535) + (l & 65535);
    return ((c >>> 16) + (a >>> 16) + (d >>> 16) + (l >>> 16) + (b >>>
        16) & 65535) << 16 | b & 65535
  }

  function R(c, a, d, l, b) {
    var g = (c & 65535) + (a & 65535) + (d & 65535) + (l & 65535) + (b & 65535);
    return ((c >>> 16) + (a >>> 16) + (d >>> 16) + (l >>> 16) + (b >>> 16) + (g
        >>> 16) & 65535) << 16 | g & 65535
  }

  function x(c) {
    var a = [], d;
    if (0 === c.lastIndexOf("SHA-", 0)) {
      switch (a = [3238371032, 914150663,
        812702999, 4144912697, 4290775857, 1750603025, 1694076839,
        3204075428], d = [1779033703, 3144134277, 1013904242, 2773480762,
        1359893119, 2600822924, 528734635, 1541459225], c) {
        case "SHA-224":
          break;
        case "SHA-256":
          a = d;
          break;
        case "SHA-384":
          a = [new m, new m,
            new m, new m, new m, new m, new m, new m];
          break;
        case "SHA-512":
          a = [new m, new m, new m, new m, new m, new m, new m, new m];
          break;
        default:
          throw Error("Unknown SHA variant");
      }
    } else {
      throw Error("No SHA variants supported");
    }
    return a
  }

  function A(c, a, d) {
    var l, b, g, f, n, k, e, h, m, r, p, w, t, x, u, z, A, B, C, D, E, F,
        v = [], G;
    if ("SHA-224" === d || "SHA-256"
        === d) {
      r = 64, w = 1, F = Number, t = P, x = Q, u = R, z = N, A = O, B = L, C = M, E = K, D = J, G = H;
    } else {
      throw Error(
          "Unexpected error in SHA-2 implementation");
    }
    d = a[0];
    l = a[1];
    b = a[2];
    g = a[3];
    f = a[4];
    n = a[5];
    k = a[6];
    e = a[7];
    for (p =
        0; p < r; p += 1) {
      16 > p ? (m = p * w, h = c.length <= m ? 0
          : c[m], m = c.length <= m + 1 ? 0 : c[m + 1], v[p] = new F(h, m))
          : v[p] = x(A(v[p - 2]), v[p - 7], z(v[p - 15]), v[p - 16]), h = u(e,
          C(f), D(f, n, k), G[p], v[p]), m = t(B(d),
          E(d, l, b)), e = k, k = n, n = f, f = t(g,
          h), g = b, b = l, l = d, d = t(h, m);
    }
    a[0] = t(d, a[0]);
    a[1] = t(l, a[1]);
    a[2] = t(b, a[2]);
    a[3] = t(g, a[3]);
    a[4] = t(f, a[4]);
    a[5] = t(n, a[5]);
    a[6] = t(k, a[6]);
    a[7] = t(e, a[7]);
    return a
  }

  var H;
  H = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993,
    2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987,
    1925078388, 2162078206,
    2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628,
    770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349,
    2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895,
    666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051,
    2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771,
    3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616,
    659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
    1955562222, 2024104815, 2227730452, 2361852424, 2428436474,
    2756734187, 3204031479, 3329325298];
  "function" === typeof define && define.amd ? define(function () {
    return w
  }) : "undefined" !== typeof exports ? ("undefined" !== typeof module
  && module.exports && (module.exports = w), exports = w) : I.jsSHA = w
})(this);

//return 32 bytes
function SHA256(msgBytes) {
  var shaObj = new jsSHA("SHA-256", "HEX");
  var msgHex = byteArray2hexStr(msgBytes);
  shaObj.update(msgHex);
  var hashHex = shaObj.getHash("HEX");
  var hashBytes = hexStr2byteArray(hashHex);
  return hashBytes;
}

//return pubkey by 65 bytes, priKeyBytes is byte[]
function getPubKeyFromPriKey(priKeyBytes) {
  var EC = elliptic.ec;
  var ec = new EC('secp256k1');
  var key = ec.keyFromPrivate(priKeyBytes, 'bytes');
  var pubkey = key.getPublic();
  var x = pubkey.x;
  var y = pubkey.y;
  var xHex = x.toString('hex');
  while (xHex.length < 64) {
    xHex = "0" + xHex;
  }
  var yHex = y.toString('hex');
  while (yHex.length < 64) {
    yHex = "0" + yHex;
  }
  var pubkeyHex = "04" + xHex + yHex;
  var pubkeyBytes = hexStr2byteArray(pubkeyHex);
  return pubkeyBytes;
}

//return address by bytes, pubBytes is byte[]
function computeAddress(add_pre_fix, pubBytes) {
  if (pubBytes.length == 65) {
    pubBytes = pubBytes.slice(1);
  }
  var hash = CryptoJS.SHA3(pubBytes).toString();
  var addressHex = hash.substring(24);
  addressHex = add_pre_fix + addressHex;
  var addressBytes = hexStr2byteArray(addressHex);
  return addressBytes;
}

//return address by Base58Check String,
function getBase58CheckAddress(addressBytes) {
  var hash0 = SHA256(addressBytes);
  var hash1 = SHA256(hash0);
  var checkSum = hash1.slice(0, 4);
  checkSum = addressBytes.concat(checkSum);
  var base58Check = encode58(checkSum);

  return base58Check;
}

function decodeBase58Address(base58Sting) {
  var zeroAddress = hexStr2byteArray(
      "000000000000000000000000000000000000000000");
  if (typeof (base58Sting) != 'string') {
    alert("Input format error!");
    return;
  }
  if (base58Sting.length <= 4) {
    alert("Input length error!");
    return;
  }
  var address = decode58(base58Sting);
  if (base58Sting.length <= 4) {
    alert("Decode58 output length error!");
    return;
  }
  var len = address.length;
  var offset = len - 4;
  var checkSum = address.slice(offset);
  address = address.slice(0, offset);
  var hash0 = SHA256(address);
  var hash1 = SHA256(hash0);
  var checkSum1 = hash1.slice(0, 4);
  if (checkSum[0] == checkSum1[0] && checkSum[1] == checkSum1[1] && checkSum[2]
      == checkSum1[2] && checkSum[3] == checkSum1[3]
  ) {
    return address;
  }
  alert("Check sum error!");
  return zeroAddress;
}

function do64Encode() {
  var src = document.getElementById('ascii').value;
  if (src.length < 2 || (src.length & 1) != 0) {
    alert("Input length error!");
    return;
  }
  var bytes = hexStr2byteArray(src);
  document.getElementById('base64').value = base64EncodeToString(bytes);
}

function do64Decode() {
  var src = document.getElementById('base64').value;
  var bytes = base64DecodeFromString(src);
  document.getElementById('ascii').value = byteArray2hexStr(bytes);
}

function do58Encode() {
  var src = document.getElementById('ascii1').value;
  if (src.length < 2 || (src.length & 1) != 0) {
    alert("Input length error!");
    return;
  }
  var bytes = hexStr2byteArray(src);
  document.getElementById('base58').value = getBase58CheckAddress(bytes);
}

function do58Decode( src) {

  var bytes = decodeBase58Address(src);
  return byteArray2hexStr(bytes);
}

function pubkey2Address(pubKeyHex) {

  if (pubKeyHex.length != 130) {
    alert("Input length error!");
    return;
  }
  var pubKey = hexStr2byteArray(pubKeyHex);
  var address;

    address = computeAddress(add_pre_fix_main, pubKey);

  return getBase58CheckAddress(address);

}
function pubkey2AddressHex(pubKeyHex) {

  if (pubKeyHex.length != 130) {
    alert("Input length error!");
    return;
  }
  var pubKey = hexStr2byteArray(pubKeyHex);
  var address;

    address = computeAddress(add_pre_fix_main, pubKey);

  return byteArray2hexStr(address);

}
function getRndPriKey() {
  var array = new Array(32);
  var count = 0;
  for (var i = 0; i < 32; i++) {
    array[i] = 0;
    for (var j = 0; j < 8; j++) {
      var random = Math.random();
      if (random >= 0.5) {
        array[i] |= (1 << j);
        count++;
      }
    }
  }
  var hexString = byteArray2hexStr(array);
  return hexString;
}

function prikey2Address(priKeyHex) {
  var net = document.getElementsByName('net1');

  if (priKeyHex == null || priKeyHex.length == 0) {
    priKeyHex = getRndPriKey();
    document.getElementById('prikey').value = priKeyHex;
  }
  if (priKeyHex.length != 64) {
    alert("Input length error!");
    return;
  }

  var pubKey = getPubKeyFromPriKey(hexStr2byteArray(priKeyHex));
  //document.getElementById('pubkey1').value = byteArray2hexStr(pubKey);
  var address;
  //if (net[0].checked == true) {
    address = computeAddress(add_pre_fix_main, pubKey);
  //} else {
  //  address = computeAddress(add_pre_fix_test, pubKey);
  //}

  //document.getElementById('addresshex1').value = byteArray2hexStr(address);
  //document.getElementById('address581').value = getBase58CheckAddress(address);
  return getBase58CheckAddress(address);
}

function main2test() {
  var mainAddress = document.getElementById('mainaddress').value;
  var address = decodeBase58Address(mainAddress);
  if (address == null) {
    return null;
  }
  if (address.length != 21) {
    return null;
  }
  if (address) {
    if (pre_fix_main != address[0]) {
      return null;
    }
  }
  address[0] = pre_fix_test;

  var testAddress = getBase58CheckAddress(address);
  document.getElementById('testaddress').value = testAddress;
}

function test2main() {
  var testAddress = document.getElementById('testaddress').value;
  var address = decodeBase58Address(testAddress);
  if (address == null) {
    return null;
  }
  if (address.length != 21) {
    return null;
  }
  if (address) {
    if (pre_fix_test != address[0]) {
      return null;
    }
  }
  address[0] = pre_fix_main;

  var mainAddress = getBase58CheckAddress(address);
  document.getElementById('mainaddress').value = mainAddress;

}