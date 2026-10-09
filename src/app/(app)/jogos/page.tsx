"use client";

import { useState } from "react";
import { 
  BrainCircuit, 
  Swords, 
  Trophy, 
  Sparkles, 
  RotateCcw, 
  Send,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemoryCard {
  id: number;
  pairId: number;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const INITIAL_CARDS: { pairId: number; label: string }[] = [
  { pairId: 1, label: "LLM" },
  { pairId: 1, label: "Modelo de Linguagem" },
  { pairId: 2, label: "RAG" },
  { pairId: 2, label: "Busca Vetorial + Contexto" },
  { pairId: 3, label: "Agente IA" },
  { pairId: 3, label: "Loop com Ferramentas" },
  { pairId: 4, label: "Prompt" },
  { pairId: 4, label: "Instrução & Diretrizes" },
];

const QUIZ_QUESTIONS = [
  {
    question: "O que significa RAG no contexto de Inteligência Artificial?",
    options: [
      "Retrieval-Augmented Generation (Geração Aumentada por Recuperação)",
      "Random Allocation of Gradients",
      "Recursive Agent Generator",
      "Realtime Automated Guidance",
    ],
    correct: 0,
    explanation: "RAG conecta modelos a bases de conhecimento externas via busca semântica em embeddings.",
  },
  {
    question: "Qual técnica incentiva o modelo a raciocinar passo a passo antes da resposta final?",
    options: [
      "Zero-Shot Direct Output",
      "Chain-of-Thought (Cadeia de Pensamento)",
      "Prompt Truncation",
      "Token Minimization",
    ],
    correct: 1,
    explanation: "Chain-of-Thought instrui a IA a detalhar etapas lógicas intermediárias, reduzindo alucinações.",
  },
  {
    question: "Qual é a principal função de um agente autônomo em comparação a um LLM comum?",
    options: [
      "Apenas traduzir textos entre idiomas",
      "Executar ações no ambiente através de ferramentas (Tools/APIs) em loop",
      "Diminuir o uso de memória RAM do navegador",
      "Limitar o tamanho da resposta a 50 palavras",
    ],
    correct: 1,
    explanation: "Agentes observam, raciocinam e executam ferramentas para atingir metas de forma iterativa.",
  },
];

export default function JogosPage() {
  const [activeTab, setActiveTab] = useState<"quiz" | "memory" | "battle">("quiz");
  const [userXp, setUserXp] = useState(250);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Memory game state
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    INITIAL_CARDS.map((c, idx) => ({ ...c, id: idx, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5)
  );
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryWon, setMemoryWon] = useState(false);

  // Prompt Battle state
  const [promptInput, setPromptInput] = useState("");
  const [battleResult, setBattleResult] = useState<{ score: number; feedback: string } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Quiz logic
  function handleSelectAnswer(idx: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const isCorrect = idx === QUIZ_QUESTIONS[currentQuestionIndex].correct;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      setUserXp((prev) => prev + 50);
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  }

  function handleRestartQuiz() {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  }

  // Memory Game logic
  function handleCardClick(id: number) {
    if (selectedCards.length === 2) return;
    const clickedCard = cards.find((c) => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const first = newCards.find((c) => c.id === newSelected[0])!;
      const second = newCards.find((c) => c.id === newSelected[1])!;

      if (first.pairId === second.pairId) {
        // Matched!
        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c) =>
              c.pairId === first.pairId ? { ...c, isMatched: true } : c
            );
            if (updated.every((c) => c.isMatched)) {
              setMemoryWon(true);
              setUserXp((x) => x + 100);
            }
            return updated;
          });
          setSelectedCards([]);
        }, 500);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newSelected.includes(c.id) ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
        }, 900);
      }
    }
  }

  function handleRestartMemory() {
    setCards(
      INITIAL_CARDS.map((c, idx) => ({ ...c, id: idx, isFlipped: false, isMatched: false }))
        .sort(() => Math.random() - 0.5)
    );
    setSelectedCards([]);
    setMemoryMoves(0);
    setMemoryWon(false);
  }

  // Prompt Battle evaluation logic
  function handleEvaluatePrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsEvaluating(true);
    setTimeout(() => {
      const length = promptInput.length;
      let score = 75;
      let feedback = "Bom prompt! Para alcançar nota 100, especifique o formato exato de saída e contexto detalhado.";

      if (promptInput.toLowerCase().includes("json") || promptInput.toLowerCase().includes("markdown")) {
        score += 15;
      }
      if (promptInput.toLowerCase().includes("passo") || promptInput.toLowerCase().includes("etapa")) {
        score += 10;
      }
      score = Math.min(100, Math.max(60, score + (length > 40 ? 5 : -5)));

      if (score >= 90) {
        feedback = "Excelente engenharia de contexto! Instruções claras, restrições estruturadas e meta determinística.";
      }

      setBattleResult({ score, feedback });
      setUserXp((prev) => prev + score);
      setIsEvaluating(false);
    }, 700);
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header with XP Badge */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">Módulo Gamificado</p>
          <h1 className="text-2xl font-bold tracking-tight">Arena de IA & Desafios</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <Zap className="size-4 fill-primary text-primary" />
          <span>{userXp} XP</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === "quiz" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="size-3.5" />
          <span>Quiz</span>
        </button>
        <button
          onClick={() => setActiveTab("memory")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === "memory" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BrainCircuit className="size-3.5" />
          <span>Memória</span>
        </button>
        <button
          onClick={() => setActiveTab("battle")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
            activeTab === "battle" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Swords className="size-3.5" />
          <span>Battle</span>
        </button>
      </div>

      {/* TAB 1: QUIZ */}
      {activeTab === "quiz" && (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          {!quizFinished ? (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Pergunta {currentQuestionIndex + 1} de {QUIZ_QUESTIONS.length}</span>
                <span>Pontos: {quizScore}</span>
              </div>

              <h2 className="text-base font-semibold leading-snug">
                {QUIZ_QUESTIONS[currentQuestionIndex].question}
              </h2>

              <div className="flex flex-col gap-2.5 pt-2">
                {QUIZ_QUESTIONS[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === QUIZ_QUESTIONS[currentQuestionIndex].correct;
                  let btnStyle = "border-border bg-background hover:bg-muted text-foreground";

                  if (selectedAnswer !== null) {
                    if (isCorrect) {
                      btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-medium";
                    } else if (isSelected) {
                      btnStyle = "border-rose-500 bg-rose-50 text-rose-950";
                    } else {
                      btnStyle = "border-border bg-background/50 text-muted-foreground opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`flex w-full items-start text-left rounded-xl border p-3.5 text-xs transition-colors ${btnStyle}`}
                    >
                      <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Explicação técnica:</p>
                  <p className="mt-0.5">{QUIZ_QUESTIONS[currentQuestionIndex].explanation}</p>
                  <Button onClick={handleNextQuestion} size="sm" className="mt-3 w-full">
                    {currentQuestionIndex + 1 < QUIZ_QUESTIONS.length ? "Próxima Pergunta" : "Ver Resultado"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <Trophy className="size-12 text-primary" />
              <h3 className="mt-3 text-lg font-bold">Quiz Concluído!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Você acertou {quizScore} de {QUIZ_QUESTIONS.length} perguntas e ganhou bônus de XP!
              </p>
              <Button onClick={handleRestartQuiz} size="sm" className="mt-4 gap-1.5">
                <RotateCcw className="size-3.5" />
                <span>Jogar Novamente</span>
              </Button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MEMORY GAME */}
      {activeTab === "memory" && (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Movimentos: {memoryMoves}</span>
            <button
              onClick={handleRestartMemory}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <RotateCcw className="size-3" /> Reiniciar
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Encontre os pares correspondentes entre as siglas e conceitos de IA.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {cards.map((card) => {
              const flipped = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`flex h-20 items-center justify-center rounded-xl border p-2 text-center text-xs font-medium transition-all ${
                    card.isMatched
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold"
                      : flipped
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {flipped ? card.label : "❓ Revelar"}
                </button>
              );
            })}
          </div>

          {memoryWon && (
            <div className="mt-2 rounded-xl bg-emerald-50 p-4 text-center text-emerald-950">
              <Sparkles className="mx-auto size-6 text-emerald-600" />
              <h4 className="mt-1 text-sm font-bold">Parabéns! Memória Neural Concluída!</h4>
              <p className="text-xs text-emerald-800">Você desbloqueou +100 XP.</p>
              <Button onClick={handleRestartMemory} size="sm" variant="outline" className="mt-3">
                Jogar Outra Rodada
              </Button>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PROMPT BATTLE */}
      {activeTab === "battle" && (
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold">Prompt Battle Arena</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Desafio: Escreva um prompt para instruir um assistente a converter dados não-estruturados em JSON válido.
            </p>
          </div>

          <form onSubmit={handleEvaluatePrompt} className="flex flex-col gap-3">
            <textarea
              rows={4}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Digite aqui o seu prompt estruturado com instruções, delimitadores e formato..."
              className="w-full rounded-xl border border-input bg-background p-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
            />

            <Button type="submit" disabled={isEvaluating || !promptInput.trim()} size="sm" className="gap-2">
              <Send className="size-3.5" />
              <span>{isEvaluating ? "Avaliando com Juiz Neural..." : "Enviar Prompt para Avaliação"}</span>
            </Button>
          </form>

          {battleResult && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Nota do Juiz Neural:</span>
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {battleResult.score} / 100
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {battleResult.feedback}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

