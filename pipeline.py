# Please noteeee We used LLMs to generate and help us refine Python code for the training pipeline, hyperparameter configuration generation, evaluation scripts , and inference methods for the BART-based summarization model. 
# It also assisted in restructuring experiments into a more sequential hyperparameter search pipeline to train a subsect of possbile configutaion to get the best fineturr model as possbile. 


import json
import random
from pathlib import Path

import evaluate
import numpy as np
import torch

from datasets import Dataset, DatasetDict
from transformers import (
    BartTokenizer,
    BartForConditionalGeneration,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    EarlyStoppingCallback,
)

MODEL_NAME = "facebook/bart-base"
NUM_EPOCHS = 3
MAX_TARGET_LENGTH = 128
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

BASE_DIR = Path("runs")
MODEL_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

with open("configs/configs.json") as f:
    configs = json.load(f)

def load_json(path):
    with open(path) as f:
        return json.load(f)

dataset = DatasetDict({
    "train": Dataset.from_list(
        load_json("linearized_data/train_linearized.json")
    ),
    "validation": Dataset.from_list(
        load_json("linearized_data/validation_linearized.json")
    ),
    "test": Dataset.from_list(
        load_json("linearized_data/test_linearized.json")
    ),
})

tokenizer = BartTokenizer.from_pretrained(MODEL_NAME)

if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

rouge = evaluate.load("rouge")

for i, c in enumerate(configs):

    lr = c["lr"]
    bs = c["batch_size"]
    ml = c["max_len"]
    beam = c["beam_size"]

    run_name = f"run{i}_lr{lr}_bs{bs}_ml{ml}_beam{beam}"

    print(f"{run_name}")

    def tokenize(batch):
        x = tokenizer(
            batch["input_text"],
            max_length=ml,
            truncation=True,
            padding="max_length",
        )

        y = tokenizer(
            batch["target_text"],
            max_length=MAX_TARGET_LENGTH,
            truncation=True,
            padding="max_length",
        )

        x["labels"] = y["input_ids"]
        return x

    tokenized = dataset.map(tokenize)

    model = BartForConditionalGeneration.from_pretrained(MODEL_NAME)
    model.to(DEVICE)
    model.gradient_checkpointing_enable()

    args = Seq2SeqTrainingArguments(
        output_dir=str(MODEL_DIR / run_name),

        learning_rate=lr,
        per_device_train_batch_size=bs,
        per_device_eval_batch_size=bs,

        num_train_epochs=NUM_EPOCHS,

        eval_strategy="epoch",
        save_strategy="epoch",

        predict_with_generate=True,
        generation_num_beams=beam,
        generation_max_length=MAX_TARGET_LENGTH,

        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,

        fp16=torch.cuda.is_available(),

        save_total_limit=1,
        logging_steps=100,

        report_to="none",
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["validation"],
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    trainer.train()

    n = min(500, len(tokenized["test"]))
    test_subset = tokenized["test"].select(range(n))

    preds = trainer.predict(test_subset)

    decoded_preds = tokenizer.batch_decode(
        preds.predictions,
        skip_special_tokens=True
    )

    # this is somthing we reasreche an foun that help to ignore padding tokekns as part of the loss
    labels = preds.label_ids
    labels[labels == -100] = tokenizer.pad_token_id

    decoded_labels = tokenizer.batch_decode(
        labels,
        skip_special_tokens=True
    )

    for i in range(len(decoded_preds)):
        decoded_preds[i] = decoded_preds[i].strip()
        decoded_labels[i] = decoded_labels[i].strip()

    scores = rouge.compute(
        predictions=decoded_preds,
        references=decoded_labels
    )

    results = {
        "run_name": run_name,
        "lr": lr,
        "batch_size": bs,
        "max_len": ml,
        "beam_size": beam,
        "rouge1": scores["rouge1"],
        "rouge2": scores["rouge2"],
        "rougeL": scores["rougeL"],
    }

    json.dump(results, open(RESULTS_DIR / f"{run_name}.json", "w"), indent=2)

    print(results)
 