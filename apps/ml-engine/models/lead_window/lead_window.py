#!/usr/bin/env python3
"""Main entry point for Pre-Event Lead Window Condition Classifier"""

import argparse
from src.train import train_lead_window_model
from src.config import LeadWindowConfig

def main():
    parser = argparse.ArgumentParser(description="Parvaah Pre-Event Lead-Window Classifier")
    parser.add_argument("--model-type", type=str, default="random_forest", choices=["random_forest", "lightgbm"])
    args = parser.parse_args()

    train_lead_window_model(model_type=args.model_type)

if __name__ == "__main__":
    main()
