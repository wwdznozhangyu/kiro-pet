// Demo vocabulary — a representative subset mirroring resources/wordbanks/*.json.
// Kept inline so the static Pages demo works with no network / build step.
// The full app loads the complete banks from resources/wordbanks and supports import.
window.DEMO_WORDS = [
  {
    word: 'significant',
    ukPhonetic: 'sɪɡˈnɪfɪkənt',
    usPhonetic: 'sɪɡˈnɪfɪkənt',
    meanings: [
      { pos: 'adj.', text: '重要的；重大的' },
      { pos: 'adj.', text: '意味深长的' }
    ],
    synonyms: ['important', 'notable', 'major'],
    tags: ['CET4', 'CET6', 'IELTS', 'TOEFL']
  },
  {
    word: 'maintain',
    ukPhonetic: 'meɪnˈteɪn',
    usPhonetic: 'meɪnˈteɪn',
    meanings: [
      { pos: 'vt.', text: '维持；保持' },
      { pos: 'vt.', text: '维修；保养' },
      { pos: 'vt.', text: '坚持（主张）' }
    ],
    synonyms: ['sustain', 'preserve', 'keep'],
    tags: ['CET4', 'CET6', 'IELTS']
  },
  {
    word: 'comprehensive',
    ukPhonetic: 'ˌkɒmprɪˈhensɪv',
    usPhonetic: 'ˌkɑːmprɪˈhensɪv',
    meanings: [
      { pos: 'adj.', text: '全面的；综合的' },
      { pos: 'adj.', text: '有理解力的' }
    ],
    synonyms: ['thorough', 'complete', 'broad'],
    tags: ['CET6', 'IELTS', 'TOEFL']
  },
  {
    word: 'meticulous',
    ukPhonetic: 'məˈtɪkjələs',
    usPhonetic: 'məˈtɪkjələs',
    meanings: [{ pos: 'adj.', text: '一丝不苟的；极仔细的' }],
    synonyms: ['careful', 'thorough', 'precise'],
    tags: ['TEM8', 'IELTS', 'TOEFL']
  },
  {
    word: 'ubiquitous',
    ukPhonetic: 'juːˈbɪkwɪtəs',
    usPhonetic: 'juːˈbɪkwɪtəs',
    meanings: [{ pos: 'adj.', text: '无处不在的；普遍存在的' }],
    synonyms: ['omnipresent', 'universal'],
    tags: ['TEM8', 'TOEFL']
  },
  {
    word: 'feasible',
    ukPhonetic: 'ˈfiːzəbl',
    usPhonetic: 'ˈfiːzəbl',
    meanings: [{ pos: 'adj.', text: '可行的；行得通的' }],
    synonyms: ['viable', 'practicable', 'possible'],
    tags: ['IELTS', 'TOEFL', 'CET6']
  },
  {
    word: 'facilitate',
    ukPhonetic: 'fəˈsɪlɪteɪt',
    usPhonetic: 'fəˈsɪlɪteɪt',
    meanings: [{ pos: 'vt.', text: '促进；使便利' }],
    synonyms: ['ease', 'assist', 'aid'],
    tags: ['TOEFL', 'IELTS', 'TEM8']
  },
  {
    word: 'abandon',
    ukPhonetic: 'əˈbændən',
    usPhonetic: 'əˈbændən',
    meanings: [
      { pos: 'vt.', text: '放弃；抛弃' },
      { pos: 'vt.', text: '遗弃（某人）' },
      { pos: 'n.', text: '放纵；狂热' }
    ],
    synonyms: ['desert', 'forsake', 'quit'],
    tags: ['CET4', 'CET6']
  },
  {
    word: 'deteriorate',
    ukPhonetic: 'dɪˈtɪəriəreɪt',
    usPhonetic: 'dɪˈtɪriəreɪt',
    meanings: [
      { pos: 'vi.', text: '恶化；退化' },
      { pos: 'vt.', text: '使变坏' }
    ],
    synonyms: ['worsen', 'decline', 'degrade'],
    tags: ['TEM8', 'IELTS', 'TOEFL']
  },
  {
    word: 'enhance',
    ukPhonetic: 'ɪnˈhɑːns',
    usPhonetic: 'ɪnˈhæns',
    meanings: [{ pos: 'vt.', text: '提高；增强' }],
    synonyms: ['improve', 'boost', 'strengthen'],
    tags: ['IELTS', 'TOEFL', 'CET6']
  },
  {
    word: 'versatile',
    ukPhonetic: 'ˈvɜːsətaɪl',
    usPhonetic: 'ˈvɜːrsətl',
    meanings: [
      { pos: 'adj.', text: '多才多艺的' },
      { pos: 'adj.', text: '多用途的；通用的' }
    ],
    synonyms: ['adaptable', 'flexible', 'all-round'],
    tags: ['CET6', 'TEM8', 'IELTS']
  },
  {
    word: 'prevalent',
    ukPhonetic: 'ˈprevələnt',
    usPhonetic: 'ˈprevələnt',
    meanings: [{ pos: 'adj.', text: '流行的；普遍的' }],
    synonyms: ['widespread', 'common', 'rife'],
    tags: ['TOEFL', 'IELTS', 'TEM8']
  }
];

window.EXAM_LABELS = {
  CET4: '四级',
  CET6: '六级',
  TEM8: '专八',
  IELTS: '雅思',
  TOEFL: '托福'
};

window.POS_CN = {
  'n.': '名词',
  'v.': '动词',
  'vt.': '及物动词',
  'vi.': '不及物动词',
  'adj.': '形容词',
  'adv.': '副词',
  'prep.': '介词',
  'conj.': '连词',
  'pron.': '代词',
  'num.': '数词',
  'phr.': '短语'
};
