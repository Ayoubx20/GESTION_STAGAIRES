import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Check } from 'lucide-react';
import { decimalToBinary, binaryToDecimal, charToBinary, binaryToChar } from './utils';

export const BinaryDecimalConverter = () => {
  const [dec, setDec] = useState('13');
  const [bin, setBin] = useState('1101');

  const handleDecChange = (e) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setDec(val);
      setBin(val === '' ? '' : decimalToBinary(parseInt(val, 10)));
    }
  };

  const handleBinChange = (e) => {
    const val = e.target.value;
    if (/^[01]*$/.test(val)) {
      setBin(val);
      setDec(val === '' ? '' : binaryToDecimal(val).toString());
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <h3 className="text-2xl font-bold text-white mb-2 text-center">Converter</h3>
      <p className="text-gray-400 mb-8 text-center text-sm">Type in either box to convert instantly.</p>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
        <div className="w-full md:w-48">
          <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Decimal</label>
          <input
            type="text"
            value={dec}
            onChange={handleDecChange}
            className="w-full bg-gray-800 text-white font-mono text-2xl p-4 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors text-center"
            placeholder="0"
          />
        </div>

        <ArrowRightLeft className="w-8 h-8 text-gray-600 hidden md:block" />

        <div className="w-full md:w-64">
          <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Binary</label>
          <input
            type="text"
            value={bin}
            onChange={handleBinChange}
            className="w-full bg-gray-800 text-green-400 font-mono text-2xl p-4 rounded-xl border border-gray-700 focus:outline-none focus:border-green-500 transition-colors text-center tracking-widest"
            placeholder="0"
          />
        </div>
      </div>

      {bin && (
        <div className="bg-gray-800/50 p-4 rounded-xl max-w-lg mx-auto text-center font-mono text-sm text-gray-400">
          <p className="mb-2 text-gray-300">{bin}</p>
          <p className="mb-2 text-xs">
            {bin.split('').reverse().map((b, i) => b === '1' ? Math.pow(2, i) : 0).reverse().join(' + ')}
          </p>
          <p className="text-white text-base font-bold">= {dec}</p>
        </div>
      )}
    </div>
  );
};

export const AsciiExplorer = () => {
  const [search, setSearch] = useState('');

  // Generate some common ASCII chars (A-Z, a-z, 0-9)
  const chars = [];
  for (let i = 33; i <= 126; i++) {
    chars.push({
      char: String.fromCharCode(i),
      dec: i,
      bin: i.toString(2).padStart(8, '0'),
      hex: i.toString(16).toUpperCase()
    });
  }

  const filteredChars = chars.filter(c =>
    c.char.toLowerCase().includes(search.toLowerCase()) ||
    c.dec.toString().includes(search)
  ).slice(0, 8); // Just show a few to not clutter

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <h3 className="text-2xl font-bold text-white mb-2">ASCII Character Explorer</h3>
      <p className="text-gray-400 mb-6">How a computer stores letters and symbols.</p>

      <input
        type="text"
        placeholder="Search for a character (e.g., A)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-cyan-500 mb-6"
        maxLength={1}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs text-gray-500 uppercase bg-gray-800">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Character</th>
              <th className="px-4 py-3">Decimal</th>
              <th className="px-4 py-3">Binary</th>
              <th className="px-4 py-3 rounded-tr-lg">Hex</th>
            </tr>
          </thead>
          <tbody>
            {filteredChars.map((item, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 font-bold text-white text-lg">{item.char}</td>
                <td className="px-4 py-3 font-mono">{item.dec}</td>
                <td className="px-4 py-3 font-mono text-green-400">{item.bin}</td>
                <td className="px-4 py-3 font-mono text-cyan-400">{item.hex}</td>
              </tr>
            ))}
            {filteredChars.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4">No characters found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TextBinaryConverter = () => {
  const [text, setText] = useState('HELLO');
  const [binary, setBinary] = useState(text.split('').map(charToBinary).join(' '));
  const [mode, setMode] = useState('textToBin'); // textToBin or binToText
  const [copied, setCopied] = useState(false);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    setBinary(val.split('').map(charToBinary).join(' '));
  };

  const handleBinaryChange = (e) => {
    const val = e.target.value;
    setBinary(val);

    // Try to parse binary back to text
    const blocks = val.split(' ').filter(b => b.length > 0);
    const converted = blocks.map(b => binaryToChar(b)).join('');
    setText(converted);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mode === 'textToBin' ? binary : text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">Text Decoder</h3>
        <button
          onClick={() => setMode(m => m === 'textToBin' ? 'binToText' : 'textToBin')}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white font-medium rounded border border-gray-700 transition-colors flex items-center gap-2"
        >
          <ArrowRightLeft className="w-3 h-3" />
          Swap Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Text Input</label>
          <textarea
            value={text}
            onChange={handleTextChange}
            disabled={mode === 'binToText'}
            className={`w-full h-32 bg-gray-800 text-white p-4 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 transition-colors resize-none ${mode === 'binToText' ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="Type text here..."
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-500 mb-2 uppercase">Binary Output</label>
          <textarea
            value={binary}
            onChange={handleBinaryChange}
            disabled={mode === 'textToBin'}
            className={`w-full h-32 bg-gray-800 text-green-400 font-mono text-sm tracking-wider p-4 rounded-xl border border-gray-700 focus:outline-none focus:border-green-500 transition-colors resize-none ${mode === 'textToBin' ? 'opacity-70 cursor-not-allowed' : ''}`}
            placeholder="Type binary here (separated by spaces)..."
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700 text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Result'}
        </button>
      </div>
    </div>
  );
};
