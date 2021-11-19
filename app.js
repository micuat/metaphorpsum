const natural = require('natural');
const nounInflector = new natural.NounInflector();
const articles = require('articles/lib/Articles.js');

const Sentencer = require('sentencer');
const randy = require('randy');

const ejdict = require('ejdict');

const hepburn = require("hepburn");

const stack = [];

Sentencer.configure({
  actions: {
    noun: function () {
      let _n = randy.choice(Sentencer._nouns);
      let n = _n;
      stack.push({type: "noun", n, _n});
      return n;
    },
    a_noun: function () {
      let _n = randy.choice(Sentencer._nouns);
      let n = articles.articlize(_n);
      stack.push({type: "a_noun", n, _n});
      return n;
    },
    nouns: function () {
      let _n = randy.choice(Sentencer._nouns);
      let n = nounInflector.pluralize(_n);
      stack.push({type: "nouns", n, _n});
      return n;
    },
    adjective: function () {
      let _n = randy.choice(Sentencer._adjectives);
      let n = _n;
      stack.push({type: "adjective", n, _n});
      return n;
    },
    an_adjective: function () {
      let _n = randy.choice(Sentencer._adjectives);
      let n = articles.articlize(_n);
      stack.push({type: "an_adjective", n, _n});
      return n;
    }
  }
})
// generate sentences synchronously...
// useful for the homepage.
function generate(numberOfSentences) {
  var sentences_en = "";
  var sentences_ja = "";
  var i = 0;
  for (i; i < numberOfSentences; i++) {
    // sentences += capitalizeFirstLetter( randomStartingPhrase() + makeSentenceFromTemplate()) + ".";
    // sentences += (numberOfSentences > 1) ? " " : "";
    stack.length = 0;
    const start = randy.choice(phrases);
    const main = randy.choice(sentenceTemplates)
    sentences_en += start.en + Sentencer.make(main.en) + ". ";
    let temp_ja = main.ja;
    for(const s of stack) {
      let ja = hepburn.toKatakana(s._n);
      let ej = ejdict(s._n);
      if (ej.length > 0) {
        ja = ej[0].mean.split("/")[0];
      }
      temp_ja = temp_ja.replace(new RegExp(`{{ ${s.type} }}`), ja)
    }
    sentences_ja += start.ja + temp_ja + "。";
  }
  return { en: sentences_en, ja: sentences_ja };
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
var sentenceTemplates = [
  {
    en: "the {{ noun }} is {{ a_noun }}",
    ja: "{{ noun }}は{{ a_noun }}だ"
  },
  {
    en: "{{ a_noun }} is {{ an_adjective }} {{ noun }}",
    ja: "{{ a_noun }}は{{ an_adjective }}{{ noun }}である"
  },
  {
    en: "the first {{ adjective }} {{ noun }} is, in its own way, {{ a_noun }}",
    ja: "初めての{{ adjective }}{{ noun }}は、ある意味では{{ a_noun }}だ"
  },
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

// partial phrases to start with. Capitalized.
var phrases = [
  { en: "To be more specific, ", ja: "より正確には、" },
  { en: "In recent years, ", ja: "近年、" },
  { en: "However, ", ja: "しかし、" },
  // {en: "Some assert that ", ja: ""},
  { en: "If this was somewhat unclear, ", ja: "それが不明瞭であれば、" },
  { en: "Unfortunately, that is wrong; on the contrary, ", ja: "しかしそれは残念ながら間違いである。対して、" },
  { en: "This could be, or perhaps ", ja: "恐らく、強いて言えば" },
  // {en: "This is not to discredit the idea that ", ja: ""},
  // {en: "We know that ", ja: ""},
  // {en: "It's an undeniable fact, really; ", ja: ""},
  // {en: "Framed in a different way, ", ja: ""},
  // {en: "What we don't know for sure is whether or not ", ja: ""},
  // {en: "As far as we can estimate, ", ja: ""},
  // {en: "The zeitgeist contends that ", ja: ""},
  // {en: "Though we assume the latter, ", ja: ""},
  // {en: "Far from the truth, ", ja: ""},
  // {en: "Extending this logic, ", ja: ""},
  // {en: "Nowhere is it disputed that ", ja: ""},
  // {en: "In modern times ", ja: ""},
  // {en: "In ancient times ", ja: ""},
  // {en: "Recent controversy aside, ", ja: ""},
];

console.log(generate(4))
