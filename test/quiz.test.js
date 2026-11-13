const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class Element {
  constructor() {
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.classes = new Set();
    this.dataset = {};
    this.style = { setProperty() {} };
    this.classList = { add: (...classes) => classes.forEach((name) => this.classes.add(name)) };
  }

  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }

  click() {
    this.listeners.click?.();
  }

  focus() {}

  querySelector(selector) {
    if (!this.parts) this.parts = {};
    if (!this.parts[selector]) this.parts[selector] = new Element();
    return this.parts[selector];
  }

  querySelectorAll(selector) {
    return selector === ".answer" ? this.children : [];
  }

  replaceChildren(...children) {
    this.children = children;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

function loadQuiz() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  const getElementById = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const progress = new Element();
  const document = {
    body: { append() {} },
    documentElement: { dataset: {} },
    createElement() {
      return new Element();
    },
    getElementById,
    querySelector() {
      return progress;
    },
  };
  const math = Object.create(Math);
  math.random = () => 0;
  const context = vm.createContext({ document, Math: math });
  vm.runInContext(script, context);
  return { context, elements, math, progress };
}

test("each run shuffles all questions without changing question or answer associations", () => {
  const { context, elements, math, progress } = loadQuiz();
  const originalQuestions = JSON.parse(vm.runInContext("JSON.stringify(questions)", context));
  const firstRun = JSON.parse(vm.runInContext("JSON.stringify(runQuestions)", context));

  assert.notDeepEqual(firstRun, originalQuestions);
  assert.deepEqual(firstRun.map(({ question }) => question).sort(),
    originalQuestions.map(({ question }) => question).sort());

  for (const [index, item] of firstRun.entries()) {
    assert.equal(elements.get("question").textContent, item.question);
    assert.equal(elements.get("category").textContent, item.category);
    assert.equal(elements.get("planet").textContent, item.planet);
    assert.deepEqual(elements.get("answers").children.map((button) => button.querySelector(".answer-text").textContent),
      item.answers);

    const buttons = elements.get("answers").children;
    const correctButton = buttons[item.correct];
    if (index === 0) {
      const wrongButton = buttons.find((button) => button !== correctButton);
      wrongButton.click();
      assert.ok(wrongButton.classes.has("incorrect"));
      assert.ok(correctButton.classes.has("reveal"));
    } else {
      correctButton.click();
      assert.ok(correctButton.classes.has("correct"));
    }
    assert.equal(elements.get("feedback-copy").textContent, item.fact);
    const score = Math.max(0, index);
    assert.equal(elements.get("score").textContent, `⭐ ${score} ${score === 1 ? "point" : "points"}`);
    assert.equal(progress.attributes["aria-valuenow"], index + 1);
    assert.equal(elements.get("progress-fill").style.width, `${((index + 1) / firstRun.length) * 100}%`);
    elements.get("next").click();
  }

  assert.match(elements.get("result").innerHTML, /9 \/ 10 correct/);
  math.random = () => 0.999;
  elements.get("restart").click();

  const restartedRun = JSON.parse(vm.runInContext("JSON.stringify(runQuestions)", context));
  assert.notDeepEqual(restartedRun, firstRun);
  assert.deepEqual(restartedRun.map(({ question }) => question).sort(),
    originalQuestions.map(({ question }) => question).sort());
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(questions)", context)), originalQuestions);
  assert.equal(elements.get("question").textContent, restartedRun[0].question);
  assert.equal(elements.get("score").textContent, "⭐ 0 points");
});
