#!/usr/bin/env python3
"""Main entry point for Static Landslide Susceptibility Pipeline"""

import argparse
from src.train import train_static_susceptibility
from src.config import SusceptibilityConfig

def main():
    parser = argparse.ArgumentParser(description="Parvaah Static Landslide Susceptibility Pipeline")
    parser.add_argument("--model-type", type=str, default="random_forest", choices=["random_forest", "xgboost", "lightgbm"])
    args = parser.parse_args()

    train_static_susceptibility(model_type=args.model_type)

if __name__ == "__main__":
    main()
