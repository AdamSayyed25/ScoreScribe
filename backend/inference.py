import os
import torch
from transformers import BartTokenizer, BartForConditionalGeneration

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "final_best_model")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[ScoreScribe] Loading model from {MODEL_PATH} on {device}...")

tokenizer = BartTokenizer.from_pretrained(MODEL_PATH)
model = BartForConditionalGeneration.from_pretrained(MODEL_PATH)
model.to(device)
model.eval()

print(f"[ScoreScribe] Model loaded successfully on {device}.")


def generate_summary(linearized_input: str) -> str:
    inputs = tokenizer(
        linearized_input,
        return_tensors="pt",
        max_length=1024,
        truncation=True,
    )
    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_length=128,
            num_beams=4,
            no_repeat_ngram_size=3,
            early_stopping=True,
        )

    summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return summary
