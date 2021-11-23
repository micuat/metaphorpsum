const natural = require('natural');
const nounInflector = new natural.NounInflector();
const articles = require('articles/lib/Articles.js');

const Sentencer = require('sentencer');
const randy = require('randy');

const ejdict = require('ejdict');

const hepburn = require("hepburn");

const stack = [];
let lastVec = [];

let numPool = 5;
let numPoolDelta = 5;

const paragraphWordCount = 2000;

const hepburnPlus = (s) => {
  let _s = hepburn.toKatakana(s);
  const consonants = {
    B: "ブ",
    C: "ク",
    D: "ド",
    F: "フ",
    G: "グ",
    H: "フ",
    J: "ジ",
    K: "ク",
    L: "ル",
    M: "ム",
    P: "プ",
    Q: "ク",
    R: "ル",
    S: "ス",
    T: "ト",
    V: "ヴ",
    W: "ウ",
    X: "クス",
    Y: "ィ",
    Z: "ズ",
    "-": "―",
  }
  _s = _s.split("").map(c => consonants[c] !== undefined ? consonants[c] : c).join("");
  return _s;
}

function pickFromPool(el) {
  const candidates = [];
  for(let i = 0; i < numPool; i++) {
    let _n = randy.choice(Sentencer[el]);
    let j = translate(_n);
    candidates.push({ score: j.fv.reduce((a,c)=>a+c,0), _n, ja: j.ja, fv: j.fv });
  }
  return candidates.reduce((p, c) => c.score > p.score ? c : p, {score: -1});
}
Sentencer.configure({
  actions: {
    noun: function () {
      let { _n, ja, fv } = pickFromPool("_nouns");
      let n = _n;
      stack.push({type: "noun", n, ja });
      lastVec = fv;
      return n;
    },
    a_noun: function () {
      let { _n, ja, fv } = pickFromPool("_nouns");
      let n = articles.articlize(_n);
      stack.push({type: "a_noun", n, ja });
      lastVec = fv;
      return n;
    },
    nouns: function () {
      let { _n, ja, fv } = pickFromPool("_nouns");
      let n = nounInflector.pluralize(_n);
      stack.push({type: "nouns", n, ja });
      lastVec = fv;
      return n;
    },
    adjective: function () {
      let { _n, ja, fv } = pickFromPool("_adjectives");
      let n = _n;
      stack.push({type: "adjective", n, ja });
      lastVec = fv;
      return n;
    },
    an_adjective: function () {
      let { _n, ja, fv } = pickFromPool("_adjectives");
      let n = _n;
      stack.push({type: "an_adjective", n, ja });
      lastVec = fv;
      return n;
    },
    numeral: function () {
      let _n = randy.choice([
        {en: "first", ja: "初めて"},
        {en: "second", ja: "二つ目"},
        {en: "third", ja: "三つ目"},
        {en: "fourth", ja: "四つ目"},
      ]);
      let n = _n.en;
      stack.push({type: "numeral", n, ja: _n.ja });
      return n;
    }
  }
})

// https://www.freecodecamp.org/news/three-ways-to-title-case-a-sentence-in-javascript-676a9175eb27/
function titleCase(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}
titleCase("I'm a little tea pot");

// generate sentences synchronously...
// useful for the homepage.
function generate(chapter) {
  let sentences_en = "";
  let sentences_ja = "";
  let i = 0;
  stack.length = 0;
  const title_format = `Chapter ${chapter+1}: The {{ adjective }} {{ noun }}`;
  let title_en = titleCase(Sentencer.make(title_format));
  let title_ja = `第${chapter+1}章 {{ adjective }}{{ noun }}`;
  for(const s of stack) {
    let ja;
    ja = s.ja;
    title_ja = title_ja.replace(new RegExp(`{{ ${s.type} }}`), ja)
  }
  while(sentences_en.split(" ").length < paragraphWordCount) {
    // sentences += capitalizeFirstLetter( randomStartingPhrase() + makeSentenceFromTemplate()) + ".";
    // sentences += (numberOfSentences > 1) ? " " : "";
    stack.length = 0;
    let start;
    if (Math.random() < 0.33) {
      start = randy.choice(phrases);
    }
    else {
      start = {en: "", ja: ""};
    }
    const main = randy.choice(sentenceTemplates)
    sentences_en += capitalizeFirstLetter(start.en + Sentencer.make(main.en) + ". ");
    let temp_ja = main.ja;
    for(const s of stack) {
      let ja;
      ja = s.ja;
      temp_ja = temp_ja.replace(new RegExp(`{{ ${s.type} }}`), ja)
    }
    let end;
    if (start.rev) {
      sentences_ja += temp_ja + start.ja + "。";
    }
    else {
      sentences_ja += start.ja + temp_ja + "。";
    }
  }
  return { en: sentences_en, ja: sentences_ja, title_en, title_ja };
}

function translate(en) {
  let ja;
  let fv = [];
  ja = hepburnPlus(en);
  let ej = ejdict(en);
  if (ej.length > 0) {
    // console.log("filtering", ej)
    let e = randy.choice(ej);
    // console.log("filtering", e.mean)
    if (/= ?[a-zA-Z]+/g.test(e.mean) === false) {
      // not "=otherword"
      let mean = e.mean;
      let temp;
      let _mean = mean.split("/").filter(m => /…‘.\'/.test(m) === false);
      function process(re) {
        temp = mean.replace(re, "");
        fv.push(temp === mean);
        mean = temp;
      }
      if(_mean.length > 0) {
        mean = randy.choice(_mean);
        process(/\(.*\)$/g);
        process(/「(.*)」/g);
        process(/《(.*)》/g);
        process(/〈(.*)〉/g);
        process(/\{(.*)\}/g);
        mean = randy.choice(mean.split(/[;,』]/));
        process(/\(.*\)$/g);
        process(/『/g);
        process(/』/g);
        process(/\(….*\)/g);
        process(/‘.+'/g);
        process(/'.+'/g);
        process(/\([a-zA-Z]+\)/g);
        // mean = mean.replace(/\(/g, "");
        // mean = mean.replace(/\)/g, "");
        process(/\[/g);
        process(/\]/g);
        process(/…/g);
        process(/ /g);
        // console.log("filtered", mean)
        if (mean.length > 0) {
          ja = mean;
        }
      }
    }
  }
  return { ja, fv };
}
// ----------------------------------------------------------------------
//                      TEMPLATES & CONVENIENCE F()s
// ----------------------------------------------------------------------

function makeSentenceFromTemplate() {
  return Sentencer.make(randy.choice(sentenceTemplates));
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// returns a starting phrase about a third of the time, otherwise it's empty
function randomStartingPhrase() {
  if (Math.random() < 0.33) {
    return randy.choice(phrases);
  }
  return "";
}

// style guide: no periods, no first capital letters.
var _sentenceTemplates = [
  {
    en: "the {{ noun }} is {{ a_noun }}",
    ja: "{{ noun }}は{{ a_noun }}だ"
  },
  {
    en: "{{ a_noun }} is {{ an_adjective }} {{ noun }}",
    ja: "{{ a_noun }}は{{ an_adjective }}{{ noun }}である"
  },
  {
    en: "the {{ numeral }} {{ adjective }} {{ noun }} is, in its own way, {{ a_noun }}",
    ja: "{{ numeral }}の{{ adjective }}{{ noun }}は、ある意味では{{ a_noun }}だ"
  },
  {
    en: "I came across {{ an_adjective }} {{ noun }}",
    ja: "ぼくは{{ an_adjective }}{{ noun }}に出会った",
    rate: 2,
  },
  {
    en: "I encountered {{ an_adjective }} {{ noun }}",
    ja: "ぼくは{{ an_adjective }}{{ noun }}に遭遇した",
    rate: 2,
  },
  {
    en: "that {{ adjective }} {{ noun }} reminded me of {{ a_noun }}",
    ja: "その{{ adjective }}な{{ noun }}は、ぼくに{{ a_noun }}を想起させた",
    rate: 2
  },
  {
    en: "that {{ adjective }} {{ noun }} made me think of {{ a_noun }}",
    ja: "その{{ adjective }}な{{ noun }}は、ぼくに{{ a_noun }}を思い起こさせた",
    rate: 2
  },
  {
    en: "behind {{ a_noun }}, I found {{ an_adjective }} {{ noun }}",
    ja: "{{ a_noun }}の裏で、ぼくは{{ an_adjective }}{{ noun }}を見つけた"
  },
  // {
  //   en: "",
  //   ja: ""
  // },
  // {en: "their {{ noun }} was, in this moment, {{ an_adjective }} {{ noun }}", 
  // ja: "彼らの{{ noun }}は、現在では{{ an_adjective }}{{ noun }}だ"},
  // {en: "{{ a_noun }} is {{ a_noun }} from the right perspective", 
  // ja: "{{ a_noun }}は正しい観点からすると{{ a_noun }}である"},
  // {en: "the literature would have us believe that {{ an_adjective }} {{ noun }} is not but {{ a_noun }}", ja: "文献によると{{ an_adjective }}{{ noun }}は{{ a_noun }}であると信じられるだろう"},
  // {en: "{{ an_adjective }} {{ noun }} is {{ a_noun }} of the mind", ja: "{{ an_adjective }}{{ noun }}は is {{ a_noun }}"},
  // {en: "the {{ adjective }} {{ noun }} reveals itself as {{ an_adjective }} {{ noun }} to those who look", 
  // ja: "{{ adjective }}{{ noun }}は調査した者には{{ an_adjective }}{{ noun }}であることが判明した"},
  // {en: "authors often misinterpret the {{ noun }} as {{ an_adjective }} {{ noun }}, when in actuality it feels more like {{ an_adjective}} {{ noun }}",
  //  ja: "著者は{{ noun }}を{{ an_adjective }}{{ noun }}と誤解したが、時に実際にはむしろ{{ an_adjective}}{{ noun }}に見える"},
  // {en: "we can assume that any instance of {{ a_noun }} can be construed as {{ an_adjective }} {{ noun }}",
  //  ja: ""},
  // {en: "they were lost without the {{ adjective }} {{ noun }} that composed their {{ noun }}",
  //  ja: ""},
  // {en: "the {{ adjective }} {{ noun }} comes from {{ an_adjective }} {{ noun }}",
  //  ja: ""},
  // {en: "{{ a_noun }} can hardly be considered {{ an_adjective }} {{ noun }} without also being {{ a_noun }}", 
  // ja: ""},
  // {en: "few can name {{ an_adjective }} {{ noun }} that isn't {{ an_adjective }} {{ noun }}",
  //  ja: ""},
  // {en: "some posit the {{ adjective }} {{ noun }} to be less than {{ adjective }}",
  //  ja: ""},
  // {en: "{{ a_noun }} of the {{ noun }} is assumed to be {{ an_adjective }} {{ noun }}",
  //  ja: ""},
  // {en: "{{ a_noun }} sees {{ a_noun }} as {{ an_adjective }} {{ noun }}",
  //  ja: ""},
  // {en: "the {{ noun }} of {{ a_noun }} becomes {{ an_adjective }} {{ noun }}",
  //  ja: ""},
  // {en: "{{ a_noun }} is {{ a_noun }}'s {{ noun }}", 
  // ja: ""},
  // {en: "{{ a_noun }} is the {{ noun }} of {{ a_noun }}", 
  // ja: ""},
  // {en: "{{ an_adjective }} {{ noun }}'s {{ noun }} comes with it the thought that the {{ adjective }} {{ noun }} is {{ a_noun }}", 
  // ja: ""},
  // {en: "{{ nouns }} are {{ adjective }} {{ nouns }}", 
  // ja: ""},
  // {en: "{{ adjective }} {{ nouns }} show us how {{ nouns }} can be {{ nouns }}",
  //  ja: ""},
  // {en: "before {{ nouns }}, {{ nouns }} were only {{ nouns }}",
  //  ja: ""},
  // {en: "those {{ nouns }} are nothing more than {{ nouns }}", 
  // ja: ""},
  // {en: "some {{ adjective }} {{ nouns }} are thought of simply as {{ nouns }}",
  //  ja: ""},
  // {en: "one cannot separate {{ nouns }} from {{ adjective }} {{ nouns }}", 
  // ja: ""},
  // {en: "the {{ nouns }} could be said to resemble {{ adjective }} {{ nouns }}", 
  // ja: ""},
  // {en: "{{ an_adjective }} {{ noun }} without {{ nouns }} is truly a {{ noun }} of {{ adjective }} {{ nouns }}", 
  // ja: ""},
];

const sentenceTemplates = [];
for(const s of _sentenceTemplates) {
  let rate = 1;
  if(s.rate !== undefined) rate = s.rate;
  if(rate == 1) {
    sentenceTemplates.push(s);
    sentenceTemplates.push(s);
  }
  else {
    sentenceTemplates.push(s);
  }
}

// partial phrases to start with. Capitalized.
var phrases = [
  { en: "To be more specific, ", ja: "より正確には、" },
  { en: "In recent years, ", ja: "近ごろ、" },
  { en: "Therefore, ", ja: "それゆえ、" },
  { en: "However, ", ja: "しかしながら、" },
  { en: "Nevertheless, ", ja: "だがしかし、" },
  { en: "I could say that ", ja: "強いて言えば、" },
  { en: "Some assert that ", ja: "という者もいるかもしれない", rev: true},
  { en: "If this was somewhat unclear, ", ja: "それが不明瞭であれば、" },
  { en: "Unfortunately, that is wrong; on the contrary, ", ja: "しかしそれは残念ながら間違いである。対して、" },
  // { en: "This could be, or perhaps ", ja: "恐らく、強いて言えば" },
  // {en: "This is not to discredit the idea that ", ja: ""},
  {en: "We know that ", ja: "知っての通り、"},
  // {en: "It's an undeniable fact, really; ", ja: ""},
  {en: "Framed in a different way, ", ja: "別の言い方をすれば、"},
  {en: "If we change the perspective, ", ja: "見かたを変えてみると、"},
  // {en: "What we don't know for sure is whether or not ", ja: ""},
  {en: "As far as we can estimate, ", ja: "想定の限りでは、"},
  // {en: "The zeitgeist contends that ", ja: ""},
  // {en: "Though we assume the latter, ", ja: ""},
  {en: "Far from the truth, ", ja: "真実とはかけ離れているが、"},
  {en: "Extending this logic, ", ja: "この論理を応用すると、"},
  // {en: "Nowhere is it disputed that ", ja: ""},
  // {en: "In modern times ", ja: ""},
  // {en: "In ancient times ", ja: ""},
  // {en: "Recent controversy aside, ", ja: ""},
];

let count = 0;
let paragraphs = [];
for (let i = 0; i < 25; i++) {
  const p = generate(i);
  count += p.en.split(" ").length;
  paragraphs.push(p);
  numPool += numPoolDelta;
}

let result = { en: "", ja: "", count };
for (const p of paragraphs) {
  result.en += `${p.title_en}
${p.en}

`
result.ja += `${p.title_ja}
${p.ja}

`
}

console.log(result.en)

console.log(result.ja)

console.log(count)
