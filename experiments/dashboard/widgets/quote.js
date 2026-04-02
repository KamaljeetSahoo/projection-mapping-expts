const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Stay hungry, stay foolish.", author: "Stewart Brand" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "The most powerful tool we have as developers is automation.", author: "Scott Hanselman" },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupery" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "The function of good software is to make the complex appear to be simple.", author: "Grady Booch" },
  { text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
  { text: "The art of programming is the art of organizing complexity.", author: "Edsger Dijkstra" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { text: "The details are not the details. They make the design.", author: "Charles Eames" },
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs" },
  { text: "Everything should be made as simple as possible, but no simpler.", author: "Albert Einstein" },
  { text: "The computer was born to solve problems that did not exist before.", author: "Bill Gates" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
];

export function initQuote() {
  const textEl = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');

  let currentIndex = -1;

  function pickRandom() {
    let idx;
    do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === currentIndex);
    currentIndex = idx;
    return QUOTES[idx];
  }

  function render() {
    const quote = pickRandom();
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = `"${quote.text}"`;
      authorEl.textContent = `— ${quote.author}`;
      textEl.style.opacity = '1';
    }, 400);
  }

  render();
  setInterval(render, 60 * 60 * 1000); // Every hour

  return { render };
}
