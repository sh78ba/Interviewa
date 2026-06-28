"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { 
  Laptop, Server, Layers, Settings, BrainCircuit, 
  User, Shield, Award, Award as StaffIcon,
  CheckCircle, FileText, Upload, AlertCircle, Sparkles, Globe,
  Star, Crown, Gem
} from "lucide-react";

const ROLES = [
  { key: "frontend", label: "Frontend", icon: Laptop },
  { key: "backend", label: "Backend", icon: Server },
  { key: "fullstack", label: "Fullstack", icon: Layers },
  { key: "devops", label: "DevOps", icon: Settings },
  { key: "ml", label: "Machine Learning", icon: BrainCircuit },
];

const COMPANY_LEVELS_MAP: Record<string, { key: string; label: string; icon: any }[]> = {
  google: [
    { key: "L3", label: "L3 (Junior SDE)", icon: User },
    { key: "L4", label: "L4 (SDE II)", icon: Award },
    { key: "L5", label: "L5 (Senior SDE)", icon: Shield },
    { key: "L6", label: "L6 (Staff SDE)", icon: Star },
    { key: "L7", label: "L7 (Senior Staff)", icon: Crown },
    { key: "L8", label: "L8 (Principal)", icon: Gem }
  ],
  meta: [
    { key: "IC3", label: "IC3 (Junior SE)", icon: User },
    { key: "IC4", label: "IC4 (Software Engineer)", icon: Award },
    { key: "IC5", label: "IC5 (Senior SE)", icon: Shield },
    { key: "IC6", label: "IC6 (Staff SE)", icon: Star },
    { key: "IC7", label: "IC7 (Senior Staff)", icon: Crown },
    { key: "IC8", label: "IC8 (Principal SE)", icon: Gem }
  ],
  amazon: [
    { key: "L4", label: "L4 (SDE I)", icon: User },
    { key: "L5", label: "L5 (SDE II)", icon: Award },
    { key: "L6", label: "L6 (Senior SDE)", icon: Shield },
    { key: "L7", label: "L7 (Principal SDE)", icon: Star },
    { key: "L8", label: "L8 (Director / Principal)", icon: Gem }
  ],
  microsoft: [
    { key: "SDE I", label: "SDE I (L59-60)", icon: User },
    { key: "SDE II", label: "SDE II (L61-62)", icon: Award },
    { key: "Senior SDE", label: "Senior SDE (L63-64)", icon: Shield },
    { key: "Principal SDE", label: "Principal SDE (L65-67)", icon: Star },
    { key: "Partner", label: "Partner SDE (L68+)", icon: Gem }
  ],
  netflix: [
    { key: "SDE I", label: "SDE I", icon: User },
    { key: "SDE II", label: "SDE II", icon: Award },
    { key: "Senior SE", label: "Senior Software Engineer", icon: Shield },
    { key: "Staff SE", label: "Staff Software Engineer", icon: Star },
    { key: "Principal SE", label: "Principal Software Engineer", icon: Gem }
  ],
  apple: [
    { key: "ICT2", label: "ICT2 (SDE I)", icon: User },
    { key: "ICT3", label: "ICT3 (SDE II)", icon: Award },
    { key: "ICT4", label: "ICT4 (Senior SDE)", icon: Shield },
    { key: "ICT5", label: "ICT5 (Staff SDE)", icon: Star },
    { key: "ICT6", label: "ICT6 (Principal)", icon: Gem }
  ],
  stripe: [
    { key: "L1", label: "L1 (Software Engineer)", icon: User },
    { key: "L2", label: "L2 (SDE II)", icon: Award },
    { key: "L3", label: "L3 (Senior SDE)", icon: Shield },
    { key: "L4", label: "L4 (Staff SDE)", icon: Star },
    { key: "L5", label: "L5 (Principal)", icon: Gem }
  ],
  uber: [
    { key: "L3a/L3b", label: "L3 (SDE I)", icon: User },
    { key: "L4", label: "L4 (SDE II)", icon: Award },
    { key: "L5", label: "L5 (Senior SDE)", icon: Shield },
    { key: "L6", label: "L6 (Staff SDE)", icon: Star },
    { key: "L7", label: "L7 (Principal)", icon: Gem }
  ],
  airbnb: [
    { key: "G3", label: "G3 (Junior)", icon: User },
    { key: "G4", label: "G4 (Mid-level)", icon: Award },
    { key: "G5", label: "G5 (Senior)", icon: Shield },
    { key: "G6", label: "G6 (Staff)", icon: Star },
    { key: "G7", label: "G7 (Principal)", icon: Gem }
  ],
  openai: [
    { key: "L2", label: "L2 (Associate)", icon: User },
    { key: "L3", label: "L3 (MTS)", icon: Award },
    { key: "L4", label: "L4 (Senior MTS)", icon: Shield },
    { key: "L5", label: "L5 (Staff MTS)", icon: Star },
    { key: "L6", label: "L6 (Principal MTS)", icon: Gem }
  ],
  nvidia: [
    { key: "IC1", label: "IC1 (Engineer)", icon: User },
    { key: "IC2", label: "IC2 (SDE)", icon: Award },
    { key: "IC3", label: "IC3 (SDE)", icon: Award },
    { key: "IC4", label: "IC4 (Senior SDE)", icon: Shield },
    { key: "IC5", label: "IC5 (Senior SDE)", icon: Shield },
    { key: "IC6", label: "IC6 (Staff)", icon: Star },
    { key: "IC7", label: "IC7 (Principal)", icon: Gem }
  ],
  tesla: [
    { key: "P1", label: "P1 (Associate)", icon: User },
    { key: "P2", label: "P2 (Engineer)", icon: Award },
    { key: "P3", label: "P3 (Senior SDE)", icon: Shield },
    { key: "P4", label: "P4 (Senior SDE)", icon: Shield },
    { key: "P5+", label: "P5+ (Principal)", icon: Gem }
  ],
  adobe: [
    { key: "L1", label: "L1 (SDE I)", icon: User },
    { key: "L2", label: "L2 (SDE II)", icon: Award },
    { key: "L3", label: "L3 (SDE II)", icon: Award },
    { key: "L4", label: "L4 (Senior SDE)", icon: Shield },
    { key: "L5+", label: "L5+ (Principal)", icon: Gem }
  ],
  salesforce: [
    { key: "Associate MTS", label: "Associate MTS", icon: User },
    { key: "MTS", label: "MTS", icon: Award },
    { key: "Senior MTS", label: "Senior MTS", icon: Shield },
    { key: "Principal MTS", label: "Principal MTS", icon: Star },
    { key: "Architect", label: "Architect", icon: Gem }
  ],
  linkedin: [
    { key: "Associate SE", label: "Associate SE", icon: User },
    { key: "Software Engineer", label: "Software Engineer", icon: Award },
    { key: "Senior SE", label: "Senior SE", icon: Shield },
    { key: "Staff SE", label: "Staff SE", icon: Star },
    { key: "Principal SE", label: "Principal SE", icon: Gem }
  ],
  palantir: [
    { key: "Associate MTS", label: "Associate MTS", icon: User },
    { key: "MTS", label: "MTS", icon: Award },
    { key: "Senior MTS", label: "Senior MTS", icon: Shield },
    { key: "Principal MTS", label: "Principal MTS", icon: Star }
  ],
  jpmorgan: [
    { key: "Associate", label: "Associate (Junior)", icon: User },
    { key: "VP", label: "Vice President (VP)", icon: Award },
    { key: "ED", label: "Executive Director", icon: Shield },
    { key: "MD", label: "Managing Director", icon: Gem }
  ],
  goldman: [
    { key: "Analyst", label: "Analyst (Junior)", icon: User },
    { key: "Associate", label: "Associate (Mid)", icon: Award },
    { key: "VP", label: "Vice President (Senior)", icon: Shield },
    { key: "MD", label: "Managing Director", icon: Gem }
  ]
};

const GENERIC_LEVELS = [
  { key: "junior", label: "Junior", icon: User },
  { key: "mid", label: "Mid-level", icon: Award },
  { key: "senior", label: "Senior", icon: Shield },
  { key: "staff", label: "Staff / Lead", icon: Star }
];

const getCompanyLevels = (companyType: string, customCompany: string = "") => {
  const comp = (companyType === "other" ? customCompany.trim() : companyType).toLowerCase();
  if (COMPANY_LEVELS_MAP[comp]) {
    return COMPANY_LEVELS_MAP[comp];
  }
  for (const key of Object.keys(COMPANY_LEVELS_MAP)) {
    if (comp.includes(key)) {
      return COMPANY_LEVELS_MAP[key];
    }
  }
  return GENERIC_LEVELS;
};

const ROUNDS = [
  { key: "resume", label: "Resume deep dive" },
  { key: "dsa", label: "DSA & Coding" },
  { key: "system_design", label: "System design" },
  { key: "technical", label: "Technical core" },
  { key: "hr", label: "HR / Behavioral" },
  { key: "cultural", label: "Cultural fit" },
];

const COMPANIES = [
  { key: "google", label: "Google" },
  { key: "meta", label: "Meta" },
  { key: "amazon", label: "Amazon" },
  { key: "microsoft", label: "Microsoft" },
  { key: "netflix", label: "Netflix" },
  { key: "apple", label: "Apple" },
  { key: "stripe", label: "Stripe" },
  { key: "uber", label: "Uber" },
  { key: "airbnb", label: "Airbnb" },
  { key: "openai", label: "OpenAI" },
  { key: "nvidia", label: "NVIDIA" },
  { key: "tesla", label: "Tesla" },
  { key: "adobe", label: "Adobe" },
  { key: "salesforce", label: "Salesforce" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
  { key: "spotify", label: "Spotify" },
  { key: "zoom", label: "Zoom" },
  { key: "slack", label: "Slack" },
  { key: "dropbox", label: "Dropbox" },
  { key: "oracle", label: "Oracle" },
  { key: "intel", label: "Intel" },
  { key: "ibm", label: "IBM" },
  { key: "cisco", label: "Cisco" },
  { key: "shopify", label: "Shopify" },
  { key: "coinbase", label: "Coinbase" },
  { key: "palantir", label: "Palantir" },
  { key: "snowflake", label: "Snowflake" },
  { key: "databricks", label: "Databricks" },
  { key: "bytedance", label: "ByteDance" },
  { key: "pinterest", label: "Pinterest" },
  { key: "snap", label: "Snap" },
  { key: "reddit", label: "Reddit" },
  { key: "lyft", label: "Lyft" },
  { key: "twilio", label: "Twilio" },
  { key: "atlassian", label: "Atlassian" },
  { key: "figma", label: "Figma" },
  { key: "canva", label: "Canva" },
  { key: "roblox", label: "Roblox" },
  { key: "paypal", label: "PayPal" },
  { key: "ebay", label: "eBay" },
  { key: "tiktok", label: "TikTok" },
  { key: "twitter", label: "Twitter / X" },
  { key: "amd", label: "AMD" },
  { key: "qualcomm", label: "Qualcomm" },
  { key: "vmware", label: "VMware" },
  { key: "square", label: "Square / Block" },
  { key: "walmart", label: "Walmart Global Tech" },
  { key: "jpmorgan", label: "JPMorgan Chase" },
  { key: "goldman", label: "Goldman Sachs" }
];

const COMPANY_LOOPS: Record<string, Record<string, { label: string; rounds: string[] }>> = {
  google: {
    junior: {
      label: "3x Technical Coding, 1x Googleyness & Leadership (2 qns)",
      rounds: ["google_coding:1", "google_coding:1", "google_coding:1", "googleyness:2"]
    },
    mid: {
      label: "3x Technical Coding, 1x Googleyness & Leadership (2 qns)",
      rounds: ["google_coding:1", "google_coding:1", "google_coding:1", "googleyness:2"]
    },
    senior: {
      label: "2x Technical Coding, 2x System Design, 1x Googleyness & Leadership (2 qns)",
      rounds: ["google_coding:1", "google_coding:1", "google_system_design:1", "google_system_design:1", "googleyness:2"]
    },
    staff: {
      label: "2x Technical Coding, 2x System Design, 1x Googleyness & Leadership (2 qns)",
      rounds: ["google_coding:1", "google_coding:1", "google_system_design:1", "google_system_design:1", "googleyness:2"]
    }
  },
  meta: {
    junior: {
      label: "2x Technical Coding, 1x Meta Behavioral (2 qns)",
      rounds: ["meta_coding:1", "meta_coding:1", "meta_behavioral:2"]
    },
    mid: {
      label: "2x Technical Coding, 1x Meta Behavioral (2 qns)",
      rounds: ["meta_coding:1", "meta_coding:1", "meta_behavioral:2"]
    },
    senior: {
      label: "2x Technical Coding, 2x System Design, 1x Meta Behavioral (2 qns)",
      rounds: ["meta_coding:1", "meta_coding:1", "meta_system_design:1", "meta_system_design:1", "meta_behavioral:2"]
    },
    staff: {
      label: "2x Technical Coding, 2x System Design, 1x Meta Behavioral (2 qns)",
      rounds: ["meta_coding:1", "meta_coding:1", "meta_system_design:1", "meta_system_design:1", "meta_behavioral:2"]
    }
  },
  amazon: {
    junior: {
      label: "1x Amazon Coding, 1x Logical Maintainability, 1x Leadership Principles (2 qns)",
      rounds: ["amazon_coding:1", "amazon_logical_maintainability:1", "amazon_leadership:2"]
    },
    mid: {
      label: "1x Amazon Coding, 1x Logical Maintainability, 1x Leadership Principles (2 qns)",
      rounds: ["amazon_coding:1", "amazon_logical_maintainability:1", "amazon_leadership:2"]
    },
    senior: {
      label: "2x Amazon Coding, 2x System Design, 1x Leadership Principles (2 qns)",
      rounds: ["amazon_coding:1", "amazon_coding:1", "amazon_system_design:1", "amazon_system_design:1", "amazon_leadership:2"]
    },
    staff: {
      label: "2x Amazon Coding, 2x System Design, 1x Leadership Principles (2 qns)",
      rounds: ["amazon_coding:1", "amazon_coding:1", "amazon_system_design:1", "amazon_system_design:1", "amazon_leadership:2"]
    }
  },
  microsoft: {
    junior: {
      label: "3x Technical Coding, 1x Microsoft Behavioral (2 qns)",
      rounds: ["microsoft_coding:1", "microsoft_coding:1", "microsoft_coding:1", "microsoft_behavioral:2"]
    },
    mid: {
      label: "3x Technical Coding, 1x Microsoft Behavioral (2 qns)",
      rounds: ["microsoft_coding:1", "microsoft_coding:1", "microsoft_coding:1", "microsoft_behavioral:2"]
    },
    senior: {
      label: "2x Technical Coding, 2x System Design, 1x Microsoft Behavioral (2 qns)",
      rounds: ["microsoft_coding:1", "microsoft_coding:1", "microsoft_system_design:1", "microsoft_system_design:1", "microsoft_behavioral:2"]
    },
    staff: {
      label: "2x Technical Coding, 2x System Design, 1x Microsoft Behavioral (2 qns)",
      rounds: ["microsoft_coding:1", "microsoft_coding:1", "microsoft_system_design:1", "microsoft_system_design:1", "microsoft_behavioral:2"]
    }
  },
  netflix: {
    junior: {
      label: "2x Technical (Coding & Architecture), 2x Cultural Fit (2 qns each)",
      rounds: ["netflix_technical:1", "netflix_technical:1", "netflix_culture:2", "netflix_culture:2"]
    },
    mid: {
      label: "2x Technical (Coding & Architecture), 2x Cultural Fit (2 qns each)",
      rounds: ["netflix_technical:1", "netflix_technical:1", "netflix_culture:2", "netflix_culture:2"]
    },
    senior: {
      label: "2x Technical (Coding & Architecture), 2x Cultural Fit (2 qns each)",
      rounds: ["netflix_technical:1", "netflix_technical:1", "netflix_culture:2", "netflix_culture:2"]
    },
    staff: {
      label: "2x Technical (Coding & Architecture), 2x Cultural Fit (2 qns each)",
      rounds: ["netflix_technical:1", "netflix_technical:1", "netflix_culture:2", "netflix_culture:2"]
    }
  },
  apple: {
    junior: {
      label: "3x Technical Core, 1x Apple Behavioral (2 qns)",
      rounds: ["apple_technical:1", "apple_technical:1", "apple_technical:1", "apple_behavioral:2"]
    },
    mid: {
      label: "3x Technical Core, 1x Apple Behavioral (2 qns)",
      rounds: ["apple_technical:1", "apple_technical:1", "apple_technical:1", "apple_behavioral:2"]
    },
    senior: {
      label: "2x Technical Core, 2x System Design, 1x Apple Behavioral (2 qns)",
      rounds: ["apple_technical:1", "apple_technical:1", "apple_system_design:1", "apple_system_design:1", "apple_behavioral:2"]
    },
    staff: {
      label: "2x Technical Core, 2x System Design, 1x Apple Behavioral (2 qns)",
      rounds: ["apple_technical:1", "apple_technical:1", "apple_system_design:1", "apple_system_design:1", "apple_behavioral:2"]
    }
  }
};

// Generate standard loops dynamically for the rest of the top 50 companies
const standardCompanies = [
  "stripe", "uber", "airbnb", "openai", "nvidia", "tesla", "adobe", "salesforce",
  "linkedin", "github", "spotify", "zoom", "slack", "dropbox", "oracle", "intel",
  "ibm", "cisco", "shopify", "coinbase", "palantir", "snowflake", "databricks",
  "bytedance", "pinterest", "snap", "reddit", "lyft", "twilio", "atlassian",
  "figma", "canva", "roblox", "paypal", "ebay", "tiktok", "twitter", "amd",
  "qualcomm", "vmware", "square", "walmart", "jpmorgan", "goldman"
];

const COMPANY_LOOPS_OVERRIDES: Record<string, Record<string, { label: string; rounds: string[] }>> = {
  stripe: {
    junior: {
      label: "1x Bug Squash, 1x Integration, 1x Practical Coding, 1x Stripe Behavioral (2 qns)",
      rounds: ["stripe_bug_squash:1", "stripe_integration:1", "stripe_coding:1", "stripe_behavioral:2"]
    },
    mid: {
      label: "1x Bug Squash, 1x Integration, 1x Practical Coding, 1x Stripe Behavioral (2 qns)",
      rounds: ["stripe_bug_squash:1", "stripe_integration:1", "stripe_coding:1", "stripe_behavioral:2"]
    },
    senior: {
      label: "1x Bug Squash, 1x Integration, 1x System Design, 1x Practical Coding, 1x Stripe Behavioral (2 qns)",
      rounds: ["stripe_bug_squash:1", "stripe_integration:1", "stripe_system_design:1", "stripe_coding:1", "stripe_behavioral:2"]
    },
    staff: {
      label: "1x Bug Squash, 1x Integration, 1x System Design, 1x Practical Coding, 1x Stripe Behavioral (2 qns)",
      rounds: ["stripe_bug_squash:1", "stripe_integration:1", "stripe_system_design:1", "stripe_coding:1", "stripe_behavioral:2"]
    }
  },
  uber: {
    junior: {
      label: "3x Technical Coding, 1x Uber Behavioral (2 qns)",
      rounds: ["uber_coding:1", "uber_coding:1", "uber_coding:1", "uber_behavioral:2"]
    },
    mid: {
      label: "3x Technical Coding, 1x Uber Behavioral (2 qns)",
      rounds: ["uber_coding:1", "uber_coding:1", "uber_coding:1", "uber_behavioral:2"]
    },
    senior: {
      label: "2x Technical Coding, 2x System Design, 1x Uber Behavioral (2 qns)",
      rounds: ["uber_coding:1", "uber_coding:1", "uber_system_design:1", "uber_system_design:1", "uber_behavioral:2"]
    },
    staff: {
      label: "2x Technical Coding, 2x System Design, 1x Uber Behavioral (2 qns)",
      rounds: ["uber_coding:1", "uber_coding:1", "uber_system_design:1", "uber_system_design:1", "uber_behavioral:2"]
    }
  },
  airbnb: {
    junior: {
      label: "2x Technical Coding, 1x Code Review, 1x Airbnb Core Values (2 qns)",
      rounds: ["airbnb_coding:1", "airbnb_coding:1", "airbnb_code_review:1", "airbnb_behavioral:2"]
    },
    mid: {
      label: "2x Technical Coding, 1x Code Review, 1x Airbnb Core Values (2 qns)",
      rounds: ["airbnb_coding:1", "airbnb_coding:1", "airbnb_code_review:1", "airbnb_behavioral:2"]
    },
    senior: {
      label: "1x Technical Coding, 1x Code Review, 1x System Design, 1x Technical Deep Dive, 1x Airbnb Core Values (2 qns)",
      rounds: ["airbnb_coding:1", "airbnb_code_review:1", "airbnb_system_design:1", "airbnb_deep_dive:1", "airbnb_behavioral:2"]
    },
    staff: {
      label: "1x Technical Coding, 1x Code Review, 1x System Design, 1x Technical Deep Dive, 1x Airbnb Core Values (2 qns)",
      rounds: ["airbnb_coding:1", "airbnb_code_review:1", "airbnb_system_design:1", "airbnb_deep_dive:1", "airbnb_behavioral:2"]
    }
  },
  openai: {
    junior: {
      label: "1x Work Trial, 2x Technical Coding, 1x OpenAI Mission Alignment (2 qns)",
      rounds: ["openai_work_trial:1", "openai_coding:1", "openai_coding:1", "openai_behavioral:2"]
    },
    mid: {
      label: "1x Work Trial, 2x Technical Coding, 1x OpenAI Mission Alignment (2 qns)",
      rounds: ["openai_work_trial:1", "openai_coding:1", "openai_coding:1", "openai_behavioral:2"]
    },
    senior: {
      label: "1x Work Trial, 1x Technical Coding, 2x System Design, 1x OpenAI Mission Alignment (2 qns)",
      rounds: ["openai_work_trial:1", "openai_coding:1", "openai_system_design:1", "openai_system_design:1", "openai_behavioral:2"]
    },
    staff: {
      label: "1x Work Trial, 1x Technical Coding, 2x System Design, 1x OpenAI Mission Alignment (2 qns)",
      rounds: ["openai_work_trial:1", "openai_coding:1", "openai_system_design:1", "openai_system_design:1", "openai_behavioral:2"]
    }
  },
  nvidia: {
    junior: {
      label: "2x Technical Coding, 1x Low-Level Systems (CUDA/OS), 1x NVIDIA Behavioral (2 qns)",
      rounds: ["nvidia_coding:1", "nvidia_coding:1", "nvidia_systems:1", "nvidia_behavioral:2"]
    },
    mid: {
      label: "2x Technical Coding, 1x Low-Level Systems (CUDA/OS), 1x NVIDIA Behavioral (2 qns)",
      rounds: ["nvidia_coding:1", "nvidia_coding:1", "nvidia_systems:1", "nvidia_behavioral:2"]
    },
    senior: {
      label: "1x Technical Coding, 2x Low-Level Systems (CUDA/OS), 1x System Design, 1x NVIDIA Behavioral (2 qns)",
      rounds: ["nvidia_coding:1", "nvidia_systems:1", "nvidia_systems:1", "nvidia_system_design:1", "nvidia_behavioral:2"]
    },
    staff: {
      label: "1x Technical Coding, 2x Low-Level Systems (CUDA/OS), 1x System Design, 1x NVIDIA Behavioral (2 qns)",
      rounds: ["nvidia_coding:1", "nvidia_systems:1", "nvidia_systems:1", "nvidia_system_design:1", "nvidia_behavioral:2"]
    }
  },
  tesla: {
    junior: {
      label: "1x Project Deep Dive, 2x Technical Coding, 1x Tesla Behavioral (2 qns)",
      rounds: ["tesla_deep_dive:1", "tesla_coding:1", "tesla_coding:1", "tesla_behavioral:2"]
    },
    mid: {
      label: "1x Project Deep Dive, 2x Technical Coding, 1x Tesla Behavioral (2 qns)",
      rounds: ["tesla_deep_dive:1", "tesla_coding:1", "tesla_coding:1", "tesla_behavioral:2"]
    },
    senior: {
      label: "1x Project Deep Dive, 1x Technical Coding, 2x System Design, 1x Tesla Behavioral (2 qns)",
      rounds: ["tesla_deep_dive:1", "tesla_coding:1", "tesla_system_design:1", "tesla_system_design:1", "tesla_behavioral:2"]
    },
    staff: {
      label: "1x Project Deep Dive, 1x Technical Coding, 2x System Design, 1x Tesla Behavioral (2 qns)",
      rounds: ["tesla_deep_dive:1", "tesla_coding:1", "tesla_system_design:1", "tesla_system_design:1", "tesla_behavioral:2"]
    }
  },
  atlassian: {
    junior: {
      label: "1x Technical Coding, 1x Interactive Craft (UI/API), 1x Atlassian Values (2 qns)",
      rounds: ["atlassian_coding:1", "atlassian_craft:1", "atlassian_behavioral:2"]
    },
    mid: {
      label: "1x Technical Coding, 1x Interactive Craft (UI/API), 1x Atlassian Values (2 qns)",
      rounds: ["atlassian_coding:1", "atlassian_craft:1", "atlassian_behavioral:2"]
    },
    senior: {
      label: "1x Technical Coding, 1x System Design, 1x Management Round, 1x Atlassian Values (2 qns)",
      rounds: ["atlassian_coding:1", "atlassian_system_design:1", "atlassian_management:1", "atlassian_behavioral:2"]
    },
    staff: {
      label: "1x Technical Coding, 1x System Design, 1x Management Round, 1x Atlassian Values (2 qns)",
      rounds: ["atlassian_coding:1", "atlassian_system_design:1", "atlassian_management:1", "atlassian_behavioral:2"]
    }
  },
  tiktok: {
    junior: {
      label: "3x Coding & CS Fundamentals, 1x TikTok Behavioral (2 qns)",
      rounds: ["tiktok_coding:1", "tiktok_coding:1", "tiktok_coding:1", "tiktok_behavioral:2"]
    },
    mid: {
      label: "3x Coding & CS Fundamentals, 1x TikTok Behavioral (2 qns)",
      rounds: ["tiktok_coding:1", "tiktok_coding:1", "tiktok_coding:1", "tiktok_behavioral:2"]
    },
    senior: {
      label: "2x Coding & CS Fundamentals, 2x System Design, 1x TikTok Behavioral (2 qns)",
      rounds: ["tiktok_coding:1", "tiktok_coding:1", "tiktok_system_design:1", "tiktok_system_design:1", "tiktok_behavioral:2"]
    },
    staff: {
      label: "2x Coding & CS Fundamentals, 2x System Design, 1x TikTok Behavioral (2 qns)",
      rounds: ["tiktok_coding:1", "tiktok_coding:1", "tiktok_system_design:1", "tiktok_system_design:1", "tiktok_behavioral:2"]
    }
  },
  linkedin: {
    junior: {
      label: "3x Technical Coding, 1x LinkedIn Behavioral (2 qns)",
      rounds: ["linkedin_coding:1", "linkedin_coding:1", "linkedin_coding:1", "linkedin_behavioral:2"]
    },
    mid: {
      label: "3x Technical Coding, 1x LinkedIn Behavioral (2 qns)",
      rounds: ["linkedin_coding:1", "linkedin_coding:1", "linkedin_coding:1", "linkedin_behavioral:2"]
    },
    senior: {
      label: "2x Technical Coding, 2x System Design, 1x LinkedIn Behavioral (2 qns)",
      rounds: ["linkedin_coding:1", "linkedin_coding:1", "linkedin_system_design:1", "linkedin_system_design:1", "linkedin_behavioral:2"]
    },
    staff: {
      label: "2x Technical Coding, 2x System Design, 1x LinkedIn Behavioral (2 qns)",
      rounds: ["linkedin_coding:1", "linkedin_coding:1", "linkedin_system_design:1", "linkedin_system_design:1", "linkedin_behavioral:2"]
    }
  }
};

standardCompanies.forEach(company => {
  if (COMPANY_LOOPS_OVERRIDES[company]) {
    COMPANY_LOOPS[company] = COMPANY_LOOPS_OVERRIDES[company];
  } else {
    const capCompany = company.charAt(0).toUpperCase() + company.slice(1);
    COMPANY_LOOPS[company] = {
      junior: {
        label: `3x Technical Coding, 1x ${capCompany} Behavioral (2 qns)`,
        rounds: [`${company}_coding:1`, `${company}_coding:1`, `${company}_coding:1`, `${company}_behavioral:2`]
      },
      mid: {
        label: `3x Technical Coding, 1x ${capCompany} Behavioral (2 qns)`,
        rounds: [`${company}_coding:1`, `${company}_coding:1`, `${company}_coding:1`, `${company}_behavioral:2`]
      },
      senior: {
        label: `2x Technical Coding, 2x System Design, 1x ${capCompany} Behavioral (2 qns)`,
        rounds: [`${company}_coding:1`, `${company}_coding:1`, `${company}_system_design:1`, `${company}_system_design:1`, `${company}_behavioral:2`]
      },
      staff: {
        label: `2x Technical Coding, 2x System Design, 1x ${capCompany} Behavioral (2 qns)`,
        rounds: [`${company}_coding:1`, `${company}_coding:1`, `${company}_system_design:1`, `${company}_system_design:1`, `${company}_behavioral:2`]
      }
    };
  }
});

export default function NewInterview() {
  const router = useRouter();
  const [isHosted, setIsHosted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      setIsHosted(host !== "localhost" && host !== "127.0.0.1");
    }
  }, []);

  const [role, setRole] = useState("fullstack");
  const [level, setLevel] = useState("mid");

  const [selectedRounds, setSelectedRounds] = useState(["technical", "hr"]);
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Target Company Selection State
  const [companyType, setCompanyType] = useState("none");
  const [customCompany, setCustomCompany] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Sync search text input with selected companyType
  useEffect(() => {
    if (companyType === "none") {
      setCompanySearch("None (Generic Interview)");
    } else if (companyType === "other") {
      setCompanySearch("Other / Custom");
    } else {
      const match = COMPANIES.find(c => c.key === companyType);
      if (match) {
        setCompanySearch(match.label);
      }
    }
  }, [companyType]);

  // Handle clicking outside the dropdown to close it and reset search text
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        // Reset query back to selected value
        if (companyType === "none") {
          setCompanySearch("None (Generic Interview)");
        } else if (companyType === "other") {
          setCompanySearch("Other / Custom");
        } else {
          const match = COMPANIES.find(c => c.key === companyType);
          if (match) setCompanySearch(match.label);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [companyType]);

  // Dynamic Web Loop Detection State
  const [useDynamicLoop, setUseDynamicLoop] = useState(false);
  const [detectingRounds, setDetectingRounds] = useState(false);
  const [detectedRoundsInfo, setDetectedRoundsInfo] = useState<{
    rounds: Array<{ key: string; name: string; count: number; instruction: string }>;
    label: string;
    rationale: string;
    is_fallback?: boolean;
  } | null>(null);

  // Reset dynamic loop state if relevant configuration changes
  useEffect(() => {
    setDetectedRoundsInfo(null);
    setUseDynamicLoop(false);
  }, [companyType, customCompany, role, level]);

  // Synchronize level selection when company changes
  useEffect(() => {
    const companyLevels = getCompanyLevels(companyType, customCompany);
    if (companyLevels.length > 0) {
      const levelExists = companyLevels.some(l => l.key === level);
      if (!levelExists) {
        const defaultLevel = companyLevels.find(l => 
          l.key === "mid" || l.key === "L4" || l.key === "IC4" || l.key === "SDE II" || l.key === "VP" || l.key === "MTS" || l.key === "Software Engineer"
        );
        setLevel(defaultLevel ? defaultLevel.key : companyLevels[0].key);
      }
    }
  }, [companyType, customCompany]);

  const [aiServiceUrl, setAiServiceUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("interviewa_ai_service_url") || localStorage.getItem("ai_service_url") || "";
    }
    return "";
  });
  const [groqApiKey, setGroqApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("interviewa_groq_api_key") || localStorage.getItem("groq_api_key") || "";
    }
    return "";
  });

  const detectRounds = async () => {
    const companyName = companyType === "other" ? customCompany.trim() : (companyType !== "none" ? companyType : "");
    if (!companyName) {
      setError("Please specify a target company name before executing web detection.");
      return;
    }

    setDetectingRounds(true);
    setDetectedRoundsInfo(null);
    setUseDynamicLoop(false);
    setError("");

    try {
      const form = new FormData();
      form.append("company", companyName);
      form.append("role", role);
      form.append("level", level);

      // Validate connection parameters in request
      const headers: Record<string, string> = {};
      if (aiServiceUrl.trim()) form.append("ai_service_url", aiServiceUrl.trim());
      if (groqApiKey.trim()) form.append("groq_api_key", groqApiKey.trim());

      const res = await api.post("/api/interview/detect-rounds", form);
      if (res.data && res.data.rounds) {
        setDetectedRoundsInfo(res.data);
        setUseDynamicLoop(true);
      } else {
        throw new Error("Invalid response schema from backend.");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to analyze real-world interview structure. Ensure connection is active.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((d: any) => `${d.loc ? d.loc.join(".") : "error"}: ${d.msg}`).join("; ");
        } else {
          errMsg = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errMsg);
    } finally {
      setDetectingRounds(false);
    }
  };

  const toggleRound = (key: string) => {
    setSelectedRounds((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key],
    );
  };

  const submit = async () => {
    let roundsToSubmit: string[] = [];
    let customRoundsConfig: string | null = null;

    if (useDynamicLoop && detectedRoundsInfo) {
      roundsToSubmit = detectedRoundsInfo.rounds.map(r => `${r.key}:${r.count}`);
      customRoundsConfig = JSON.stringify(detectedRoundsInfo.rounds);
    } else {
      roundsToSubmit = selectedRounds;
    }

    if (roundsToSubmit.length === 0) {
      setError("Please select at least one interview round.");
      return;
    }

    // Validate that we have at least one AI service URL or Groq Key when hosted
    if (isHosted && !aiServiceUrl.trim() && !groqApiKey.trim()) {
      setError("Please configure your Colab GPU / Ngrok URL or Groq API Key to start the interview on a hosted environment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (typeof window !== "undefined") {
        if (aiServiceUrl.trim()) {
          localStorage.setItem("interviewa_ai_service_url", aiServiceUrl.trim());
        } else {
          localStorage.removeItem("interviewa_ai_service_url");
        }
        if (groqApiKey.trim()) {
          localStorage.setItem("interviewa_groq_api_key", groqApiKey.trim());
        } else {
          localStorage.removeItem("interviewa_groq_api_key");
        }
      }

      const companyName = companyType === "other" ? customCompany.trim() : (companyType !== "none" ? companyType : "");

      const form = new FormData();
      form.append("role", role);
      form.append("level", level);
      form.append("rounds", roundsToSubmit.join(","));
      form.append("job_description", jobDescription);
      if (companyName) {
        form.append("company", companyName);
      }
      if (resume) form.append("resume", resume);
      if (customRoundsConfig) {
        form.append("custom_rounds_config", customRoundsConfig);
      }

      const res = await api.post("/api/interview/start", form);
      router.push(`/interview/${res.data.interview_id}`);
    } catch (err: any) {
      console.error(err);
      let errMsg = "Failed to start the interview session. Please try again.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((d: any) => `${d.loc ? d.loc.join(".") : "error"}: ${d.msg}`).join("; ");
        } else {
          errMsg = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ 
        minHeight: "calc(100vh - 72px)", 
        display: "flex", 
        alignItems: "flex-start", 
        justifyContent: "center", 
        padding: "40px 16px",
        background: "var(--bg-soft)",
        boxSizing: "border-box"
      }}>
        <div className="surface" style={{ width: "100%", maxWidth: 1120, padding: "20px 24px", borderRadius: 12 }}>
          {/* Header */}
          <div style={{ marginBottom: 16 }}>
            <span className="page-kicker" style={{ fontSize: 11, padding: "2px 6px" }}>Interview setup</span>
            <div
              style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 8, marginBottom: 2 }}
            >
              CREATE A NEW SESSION
            </div>
            <h1 className="section-title" style={{ fontSize: 22 }}>New interview</h1>
            <p
              style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}
            >
              Configure your practice session. Select a target company to simulate authentic loops and scrape real-world interview context.
            </p>
          </div>

          {/* Setup Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Row 1: Target Company (Searchable Dropdown) */}
            <div className="setup-grid">
              <div ref={companyDropdownRef} style={{ position: "relative" }}>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Target Company</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setIsDropdownOpen(true);
                      if (companyType === "none" || companyType === "other") {
                        setCompanySearch("");
                      }
                    }}
                    placeholder="Search target company..."
                    className="input"
                    style={{ 
                      fontSize: 12, 
                      padding: "8px 12px", 
                      width: "100%",
                      background: "var(--panel-strong)", 
                      color: "var(--text-strong)", 
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      height: "38px",
                      boxSizing: "border-box"
                    }}
                  />
                  <span style={{ 
                    position: "absolute", 
                    right: 12, 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    color: "var(--muted)",
                    fontSize: 8,
                    pointerEvents: "none"
                  }}>
                    ▼
                  </span>
                </div>

                {isDropdownOpen && (
                  <div className="surface" style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "220px",
                    overflowY: "auto",
                    zIndex: 110,
                    marginTop: 4,
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--bg)",
                    boxShadow: "var(--shadow-lg)"
                  }}>
                    {[
                      { key: "none", label: "None (Generic Interview)" },
                      ...COMPANIES,
                      { key: "other", label: "Other / Custom" }
                    ]
                      .filter(opt => opt.label.toLowerCase().includes(companySearch.toLowerCase()))
                      .map((opt) => (
                        <div
                          key={opt.key}
                          onClick={() => {
                            setCompanyType(opt.key);
                            setIsDropdownOpen(false);
                            if (opt.key !== "none") {
                              setRole(""); // Unselect role by default when a company is selected
                            } else {
                              setRole("fullstack");
                            }
                          }}
                          style={{
                            padding: "8px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            background: companyType === opt.key ? "var(--bg-soft)" : "transparent",
                            color: companyType === opt.key ? "var(--text-strong)" : "var(--text)",
                            fontWeight: companyType === opt.key ? 750 : 500
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "var(--bg-soft)";
                            (e.currentTarget as HTMLDivElement).style.color = "var(--text-strong)";
                          }}
                          onMouseLeave={(e) => {
                            if (companyType !== opt.key) {
                              (e.currentTarget as HTMLDivElement).style.background = "transparent";
                              (e.currentTarget as HTMLDivElement).style.color = "var(--text)";
                            }
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    {[
                      { key: "none", label: "None (Generic Interview)" },
                      ...COMPANIES,
                      { key: "other", label: "Other / Custom" }
                    ].filter(opt => opt.label.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                        No companies found. Select "Other / Custom".
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Company input */}
              {companyType === "other" && (
                <div>
                  <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Custom Company Name</label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="Enter custom company (e.g. Stripe, OpenAI)"
                    className="input"
                    style={{ 
                      fontSize: 12, 
                      padding: "8px 12px",
                      width: "100%",
                      boxSizing: "border-box",
                      height: "38px"
                    }}
                  />
                </div>
              )}
            </div>

            {/* Row 2: Role & Experience Level */}
            <div className="setup-grid">
              {/* Target Role */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Role</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.key;
                    return (
                      <button
                        key={r.key}
                        onClick={() => setRole(role === r.key ? "" : r.key)}
                        className="surface-strong"
                        style={{
                          padding: "8px 6px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          gridColumn: r.key === "ml" ? "span 2" : "auto",
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                          background: active ? "var(--bg-soft)" : "var(--panel-strong)",
                          color: "var(--text-strong)",
                        }}
                      >
                        <Icon size={14} color={active ? "#111111" : "#777777"} />
                        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                {role === "" && (
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, fontStyle: "italic", lineHeight: 1.3 }}>
                    No role selected. Role & skill details will be dynamically inferred from your resume and company web search context during the interview.
                  </div>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>Experience level</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                  {getCompanyLevels(companyType, customCompany).map((l) => {
                    const Icon = l.icon;
                    const active = level === l.key;
                    return (
                      <button
                        key={l.key}
                        onClick={() => setLevel(l.key)}
                        className="surface-strong"
                        style={{
                          padding: "8px 6px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          border: active ? "1px solid #111111" : "1px solid var(--line)",
                          background: active ? "var(--bg-soft)" : "var(--panel-strong)",
                          color: "var(--text-strong)",
                        }}
                      >
                        <Icon size={12} color={active ? "#111111" : "#777777"} />
                        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Calibration Settings (Required when Hosted) */}
            {isHosted && (
              <div style={{ 
                marginTop: 4, 
                padding: "16px 20px", 
                borderRadius: 8, 
                border: "1px solid var(--line)", 
                background: "rgba(0, 0, 0, 0.01)" 
              }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>
                  AI Service Configuration
                </h4>
                <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, lineHeight: 1.4 }}>
                  To run the speech transcription and LLM evaluation, specify your Google Colab Ngrok tunnel URL or your Groq API Key. Leaving both blank will default to the hosted server's local configuration.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  <div>
                    <label className="field-label" style={{ fontSize: 11, marginBottom: 4, display: "block" }}>Colab GPU / Ngrok Service URL</label>
                    <input
                      type="text"
                      value={aiServiceUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAiServiceUrl(val);
                        if (typeof window !== "undefined") {
                          if (val.trim()) localStorage.setItem("interviewa_ai_service_url", val.trim());
                          else localStorage.removeItem("interviewa_ai_service_url");
                        }
                      }}
                      placeholder="https://xxxx.ngrok-free.app"
                      className="input"
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: 11, marginBottom: 4, display: "block" }}>Groq API Key (Optional Fallback)</label>
                    <input
                      type="password"
                      value={groqApiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGroqApiKey(val);
                        if (typeof window !== "undefined") {
                          if (val.trim()) localStorage.setItem("interviewa_groq_api_key", val.trim());
                          else localStorage.removeItem("interviewa_groq_api_key");
                        }
                      }}
                      placeholder="gsk_..."
                      className="input"
                      style={{ fontSize: 12, padding: "8px 12px" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Company Options Card & Scrape Badge */}
            {companyType !== "none" && (
              <div className="surface-strong" style={{ 
                padding: "16px 20px", 
                borderRadius: 8, 
                border: "1px solid var(--line)", 
                background: "rgba(0, 0, 0, 0.01)", 
                display: "flex", 
                flexDirection: "column", 
                gap: 12 
              }}>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes ddg-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes ddg-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .4; }
                  }
                `}} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ 
                      fontSize: 9, 
                      fontWeight: 700, 
                      color: "white", 
                      background: "#111111", 
                      padding: "3px 8px", 
                      borderRadius: 3,
                      letterSpacing: "0.05em",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <Sparkles size={10} /> DUCKDUCKGO WEB SCRAPING ENABLED
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      Real-world questions will be fetched for {companyType === "other" ? (customCompany || "custom company") : companyType}.
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      disabled={detectingRounds}
                      onClick={detectRounds}
                      style={{
                        background: useDynamicLoop ? "var(--bg-soft)" : "#111",
                        color: useDynamicLoop ? "var(--text-strong)" : "white",
                        border: useDynamicLoop ? "1px solid var(--line)" : "none",
                        padding: "6px 12px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 650,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: detectingRounds ? 0.7 : 1,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <Globe size={11} style={{ animation: detectingRounds ? "ddg-spin 1s linear infinite" : "none" }} />
                      {detectingRounds ? "Researching Web..." : useDynamicLoop ? "Refresh Real-World Loop" : "Detect Loop from Web"}
                    </button>
                  </div>
                </div>

                {/* Loading Skeleton */}
                {detectingRounds && (
                  <div style={{ 
                    borderLeft: "2.5px solid var(--line)", 
                    paddingLeft: 12,
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    animation: "ddg-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  }}>
                    <div style={{ height: 10, background: "var(--line)", width: "25%", borderRadius: 2 }} />
                    <div style={{ height: 14, background: "var(--line)", width: "55%", borderRadius: 2 }} />
                    <div style={{ height: 10, background: "var(--line)", width: "70%", borderRadius: 2 }} />
                  </div>
                )}

                {/* Dynamic Web Loop Details */}
                {useDynamicLoop && detectedRoundsInfo && (
                  <div style={{ 
                    borderLeft: `2.5px solid ${detectedRoundsInfo.is_fallback ? "#e11d48" : "#22c55e"}`, 
                    paddingLeft: 12,
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: detectedRoundsInfo.is_fallback ? "#e11d48" : "#22c55e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {detectedRoundsInfo.is_fallback ? "Fallback Template Applied (Web Search failed)" : "Active Real-World Loop Detected"}
                      </span>
                      <span style={{ 
                        fontSize: 8, 
                        fontWeight: 700, 
                        color: "white", 
                        background: detectedRoundsInfo.is_fallback ? "#e11d48" : "#22c55e", 
                        padding: "1px 5px", 
                        borderRadius: 2 
                      }}>{detectedRoundsInfo.is_fallback ? "FALLBACK" : "AI SYNTHESIZED"}</span>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text-strong)", fontWeight: 650 }}>
                      {detectedRoundsInfo.label}
                    </div>

                    <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.4 }}>
                      "{detectedRoundsInfo.rationale}"
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                      {detectedRoundsInfo.rounds.map((rnd, i) => (
                        <div key={i} className="surface" style={{ 
                          padding: "4px 8px", 
                          borderRadius: 4, 
                          border: "1px solid var(--line)", 
                          fontSize: 10, 
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "var(--panel-strong)"
                        }}>
                          <span style={{ color: "var(--text-strong)", fontWeight: 700 }}>{rnd.name}</span>
                          <span style={{ 
                            fontSize: 9, 
                            color: "var(--muted)", 
                            background: "var(--bg-soft)", 
                            padding: "1px 4px", 
                            borderRadius: 2 
                          }}>{rnd.count} qn{rnd.count > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rounds */}
            <div style={{ opacity: useDynamicLoop ? 0.5 : 1, pointerEvents: useDynamicLoop ? "none" : "auto", transition: "all 0.2s ease" }}>
              <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>
                Rounds {useDynamicLoop && <span style={{ color: "var(--muted)", fontWeight: 400 }}>(Managed automatically by AI Web Search)</span>}
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ROUNDS.map((r) => {
                  const active = selectedRounds.includes(r.key);
                  return (
                    <button
                      key={r.key}
                      onClick={() => toggleRound(r.key)}
                      className={active ? "chip chip-active" : "chip"}
                      style={{
                        padding: "6px 12px",
                        fontSize: 11,
                        borderRadius: 4,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        border: active ? "1px solid #111111" : "1px solid var(--line)",
                      }}
                    >
                      {active && <CheckCircle size={10} color="white" />}
                      <span style={{ fontFamily: active ? "'Lora', Georgia, serif" : "inherit", fontStyle: active ? "italic" : "normal" }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Resume & Job Description */}
            <div className="setup-grid">
              {/* Resume File Upload */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>
                  Resume{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <div 
                  className="surface-strong"
                  style={{ 
                    border: "1px dashed var(--line)", 
                    borderRadius: 6, 
                    padding: 12, 
                    textAlign: "center",
                    position: "relative",
                    background: "rgba(0, 0, 0, 0.01)",
                    height: "82px",
                    minHeight: "82px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                    style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      width: "100%", 
                      height: "100%", 
                      opacity: 0, 
                      cursor: "pointer",
                      zIndex: 10
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Upload size={14} color="#777" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-strong)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {resume ? resume.name : "Upload resume (PDF)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="field-label" style={{ fontSize: 12, marginBottom: 4 }}>
                  Job description{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="textarea"
                  style={{ fontSize: 12, lineHeight: 1.4, padding: "8px 12px", height: "82px", minHeight: "82px", resize: "none" }}
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                display: "flex", 
                gap: 8, 
                alignItems: "center", 
                color: "var(--text-strong)", 
                background: "var(--bg-soft)",
                border: "1px solid var(--accent-strong)",
                padding: "8px 12px",
                borderRadius: 6
              }}>
                <AlertCircle size={14} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="button-primary"
              style={{ width: "100%", padding: "10px 16px", fontSize: 13 }}
            >
              {loading ? "Setting up interview..." : "Start interview"}
            </button>
          </div>
        </div>
      </main>

      <style>{`
        .setup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .setup-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
