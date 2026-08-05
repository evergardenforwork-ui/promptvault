const fs = require('fs');
const text = fs.readFileSync('src/components/ui/FileTreeViewer.tsx', 'utf8');
const win1251 = 
  '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f' +
  '\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f' +
  ' !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ ' +
  '\u0402\u0403\u201A\u0453\u201E\u2026\u2020\u2021\u20AC\u2030\u0409\u2039\u040A\u040C\u040B\u040F' +
  '\u0452\u2018\u2019\u201C\u201D\u2022\u2013\u2014\uFFFD\u2122\u0459\u203A\u045A\u045C\u045B\u045F' +
  '\u00A0\u040E\u045E\u0408\u00A4\u0490\u00A6\u00A7\u0401\u00A9\u0404\u00AB\u00AC\u00AD\u00AE\u0407' +
  '\u00B0\u00B1\u0406\u0456\u0491\u00B5\u00B6\u00B7\u0451\u2116\u0454\u00BB\u0458\u00BD\u0455\u0457' +
  '\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F' +
  '\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F' +
  '\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F' +
  '\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F';

const reverseMap = {};
for (let i = 0; i < 256; i++) {
  reverseMap[win1251[i]] = i;
}
// fallback for 0x98 undefined in javascript map
reverseMap['\uFFFD'] = 0x98;

const bytes = new Uint8Array(text.length);
for (let i = 0; i < text.length; i++) {
  const char = text[i];
  if (char.charCodeAt(0) > 255) {
      if (reverseMap[char] !== undefined) {
          bytes[i] = reverseMap[char];
      } else {
          bytes[i] = char.charCodeAt(0) & 0xFF;
      }
  } else {
      bytes[i] = char.charCodeAt(0);
  }
}

const originalUtf8 = new TextDecoder('utf-8').decode(bytes);
fs.writeFileSync('src/components/ui/FileTreeViewer.tsx', originalUtf8, 'utf8');
console.log('Fixed using custom decoder!');
