import json
import random
from services.llm_service import llm

ROUND_CONFIGS = {
    "dsa": {
        "name": "DSA Round",
        "count": 5,
        "task": "question_generation",
        "prompt_hint": "data structures, algorithms, time/space complexity, coding problems"
    },
    "system_design": {
        "name": "System Design Round",
        "count": 3,
        "task": "question_generation",
        "prompt_hint": "system design, scalability, databases, caching, APIs, distributed systems"
    },
    "technical": {
        "name": "Technical Round",
        "count": 6,
        "task": "question_generation",
        "prompt_hint": "language-specific, frameworks, tools, concepts from candidate's stack"
    },
    "hr": {
        "name": "HR Round",
        "count": 4,
        "task": "hr",
        "prompt_hint": "behavioural, STAR format, teamwork, conflict, growth mindset"
    },
    "cultural": {
        "name": "Cultural Fit Round",
        "count": 3,
        "task": "hr",
        "prompt_hint": "values alignment, work style, motivation, career goals"
    },
    "resume": {
        "name": "Resume Deep Dive",
        "count": 5,
        "task": "question_generation",
        "prompt_hint": "specific questions about candidate's projects, experience, and decisions"
    },
    "google_coding": {
        "name": "Google Technical Coding",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Google-style algorithmic problem solving, efficiency, data structures, optimization, time/space complexity analysis."
    },
    "google_system_design": {
        "name": "Google System Design",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Google-scale distributed systems, latency, scalability, reliability, storage engines, caching, network protocols."
    },
    "googleyness": {
        "name": "Googleyness & Leadership",
        "count": 2,
        "task": "hr",
        "prompt_hint": "Googley attributes: dealing with ambiguity, valuing diversity, feedback, doing the right thing, supporting team members."
    },
    "meta_coding": {
        "name": "Meta Technical Coding",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Meta-style fast-paced algorithmic coding, clean implementation, optimal space/time complexity, data structures."
    },
    "meta_system_design": {
        "name": "Meta System Design",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Meta-scale system design: architecture, scalability, messaging queues, databases, feed systems, caching."
    },
    "meta_behavioral": {
        "name": "Meta Behavioral",
        "count": 2,
        "task": "hr",
        "prompt_hint": "Meta core values: move fast, focus on impact, build awesome things, live in the future, be direct."
    },
    "amazon_coding": {
        "name": "Amazon Technical Coding",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Amazon technical coding, algorithms, complexity analysis, data structures, edge cases."
    },
    "amazon_system_design": {
        "name": "Amazon System Design",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Amazon system design: service-oriented architecture (SOA), scaling database shards, AWS-style services, load balancing."
    },
    "amazon_logical_maintainability": {
        "name": "Amazon Logical Maintainability",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Object-oriented design (OOD), clean code, separation of concerns, design patterns, writing testable and maintainable logic."
    },
    "amazon_leadership": {
        "name": "Amazon Leadership Principles",
        "count": 2,
        "task": "hr",
        "prompt_hint": "Amazon Leadership Principles: customer obsession, ownership, invent and simplify, deep dive, deliver results."
    },
    "microsoft_coding": {
        "name": "Microsoft Technical Coding",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Microsoft technical coding, algorithmic efficiency, robust error handling, data structures, pointer/reference management."
    },
    "microsoft_system_design": {
        "name": "Microsoft System Design",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Microsoft Azure cloud scale system design, messaging infrastructure, partitioning, databases."
    },
    "microsoft_behavioral": {
        "name": "Microsoft Behavioral",
        "count": 2,
        "task": "hr",
        "prompt_hint": "Microsoft growth mindset, collaboration, inclusion, customer obsession, drive for results."
    },
    "netflix_technical": {
        "name": "Netflix Technical",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Netflix streaming scale backend/frontend architecture, microservices, fallback mechanisms, caching, optimization."
    },
    "netflix_culture": {
        "name": "Netflix Cultural Fit",
        "count": 2,
        "task": "hr",
        "prompt_hint": "Netflix Culture: freedom and responsibility, absolute honesty, high performance, selflessness."
    },
    "apple_technical": {
        "name": "Apple Technical Core",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Apple-style technical concepts, resource management, performance optimization, concurrency, system internals."
    },
    "apple_system_design": {
        "name": "Apple System Design",
        "count": 1,
        "task": "question_generation",
        "prompt_hint": "Apple hardware-software system design, data privacy, media delivery scaling, secure key storage."
    },
    "apple_behavioral": {
        "name": "Apple Behavioral",
        "count": 2,
        "task": "hr",
        "prompt_hint": "Apple values: attention to detail, passion for user experience, overcoming technical challenges under tight deadlines."
    }
}

def _parse(raw: str) -> list[dict]:
    raw = raw.strip()
    
    # Try to find the outermost JSON array by looking for first '[' and last ']'
    start_idx = raw.find('[')
    end_idx = raw.rfind(']')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_str = raw[start_idx:end_idx + 1]
        try:
            result = json.loads(json_str)
            if isinstance(result, list):
                return result
        except Exception:
            pass

    # Alternate parsing: split by markdown code blocks
    if "```" in raw:
        try:
            parts = raw.split("```")
            for part in parts[1::2]:
                content = part.strip()
                if content.startswith("json"):
                    content = content[4:].strip()
                result = json.loads(content)
                if isinstance(result, list):
                    return result
        except Exception:
            pass

    try:
        result = json.loads(raw)
        return result if isinstance(result, list) else []
    except Exception:
        return []

ROUND_INSTRUCTIONS = {
    "resume": """
This is a Resume Deep Dive round.
CRITICAL INSTRUCTIONS:
- You MUST focus ONLY and strictly on the candidate's resume (their projects, experience, choices, achievements, and technical stack described in their resume profile).
- Do not ask generic questions. Every question must relate directly to something on the candidate's resume.
- If no resume profile, skills, or projects are available, ask general questions about the candidate's past real-world project experience, their specific role in it, and key decisions they made.
- Set "is_coding" to false for all questions.
""",
    "dsa": """
This is a DSA & Coding round.
CRITICAL INSTRUCTIONS:
- You MUST generate ONLY coding questions (algorithm and data structure problems).
- Do not ask theoretical or conversational questions.
- Set "is_coding" to true for EVERY question in this round.
""",
    "system_design": """
This is a System Design round.
CRITICAL INSTRUCTIONS:
- You MUST split the questions: exactly 50% must be High-Level Design (HLD) questions (e.g., scalability, microservices, databases, system architecture, caching, CDNs) and exactly 50% must be Low-Level Design (LDD) questions (e.g., class/component design, database schema design, design patterns, API signatures, concurrency).
- For all High-Level Design (HLD) questions, set "is_coding" to false.
- For all Low-Level Design (LLD) questions, the candidate is required to write code (e.g. implementing class structures, interface designs, pattern templates, or schema classes). You MUST set "is_coding" to true for all Low-Level Design (LLD) questions.
""",
    "technical": """
This is a Technical Core round.
CRITICAL INSTRUCTIONS:
- You MUST ask core subject questions as well as other technical stack questions.
- Maintain a balance of approximately 40% core computer science subject questions (e.g., database indexing/transactions, OS threads/processes/memory management, computer networking protocols, OOP/FP fundamentals) and 60% other technical questions (specific language features, frameworks, libraries, and tools relevant to the candidate's stack).
- Set "is_coding" to false for these questions.
""",
    "hr": """
This is an HR / Behavioral round.
CRITICAL INSTRUCTIONS:
- Focus strictly on HR-related, behavioral traits, soft skills, teamwork, handling conflict, career growth, and situational scenarios.
- Do NOT ask any technical questions, coding problems, language-specific syntax questions, or system design questions.
- Set "is_coding" to false for all questions.
""",
    "cultural": """
This is a Cultural Fit round.
CRITICAL INSTRUCTIONS:
- Focus strictly on cultural alignment, work style preferences, collaboration, motivation, company values fit, and career goals.
- Do NOT ask any technical or coding questions.
- Set "is_coding" to false for all questions.
""",
    "google_coding": """
This is a Google Technical Coding round.
CRITICAL INSTRUCTIONS:
- Generate 1 complex algorithmic problem in Google's design style.
- Focus on efficient data structures, scale, optimal complexity, and trade-offs.
- Set "is_coding" to true.
""",
    "google_system_design": """
This is a Google System Design round.
CRITICAL INSTRUCTIONS:
- Generate 1 large-scale distributed architecture problem (e.g., Google Search, Maps, YouTube scaling).
- Focus on networking, latency, storage engines, partitioning, caches, and load balancers.
- Set "is_coding" to false.
""",
    "googleyness": """
This is a Googleyness & Leadership round.
CRITICAL INSTRUCTIONS:
- Focus on Googley traits: dealing with ambiguity, bias for action, intellectual humility, doing the right thing, supporting team dynamics.
- Set "is_coding" to false.
""",
    "meta_coding": """
This is a Meta Technical Coding round.
CRITICAL INSTRUCTIONS:
- Generate 1 fast-paced algorithmic coding question (Meta style).
- Focus on direct implementation, optimal time/space complexity, and clean logic.
- Set "is_coding" to true.
""",
    "meta_system_design": """
This is a Meta System Design round.
CRITICAL INSTRUCTIONS:
- Generate 1 scale design problem (e.g., newsfeed, messaging queue, notification system).
- Focus on cache layers, load balancing, real-time data sync, data consistency.
- Set "is_coding" to false.
""",
    "meta_behavioral": """
This is a Meta Behavioral round.
CRITICAL INSTRUCTIONS:
- Focus on Meta values: move fast, focus on impact, build awesome things, be direct.
- Set "is_coding" to false.
""",
    "amazon_coding": """
This is an Amazon Technical Coding round.
CRITICAL INSTRUCTIONS:
- Generate 1 algorithmic coding problem.
- Focus on correct implementation, complexity analysis, and edge cases.
- Set "is_coding" to true.
""",
    "amazon_system_design": """
This is an Amazon System Design round.
CRITICAL INSTRUCTIONS:
- Generate 1 service-oriented architecture (SOA) or scale design problem.
- Focus on databases, read/write load distribution, AWS services, and decoupling.
- Set "is_coding" to false.
""",
    "amazon_logical_maintainability": """
This is an Amazon Logical Maintainability and Object-Oriented Design (OOD) round.
CRITICAL INSTRUCTIONS:
- Generate a coding challenge requiring clean object design, SOLID principles, interfaces, patterns, and refactoring.
- The candidate must write code. Set "is_coding" to true.
""",
    "amazon_leadership": """
This is an Amazon Leadership Principles behavioral round.
CRITICAL INSTRUCTIONS:
- Generate behavioral scenarios specifically highlighting Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action, Earn Trust, Dive Deep).
- Set "is_coding" to false.
""",
    "microsoft_coding": """
This is a Microsoft Technical Coding round.
CRITICAL INSTRUCTIONS:
- Generate 1 algorithmic coding problem.
- Focus on clean memory management, pointer manipulation (or reference safety), robust logic.
- Set "is_coding" to true.
""",
    "microsoft_system_design": """
This is a Microsoft System Design round.
CRITICAL INSTRUCTIONS:
- Generate 1 distributed system design question (Azure scale).
- Focus on partitioning, cloud security, state replication, high availability.
- Set "is_coding" to false.
""",
    "microsoft_behavioral": """
This is a Microsoft Behavioral round.
CRITICAL INSTRUCTIONS:
- Focus on Microsoft's growth mindset, empathy, collaboration, and learning from failure.
- Set "is_coding" to false.
""",
    "netflix_technical": """
This is a Netflix Technical round.
CRITICAL INSTRUCTIONS:
- Generate 1 microservices, streaming scale, performance, or content delivery network coding problem.
- Set "is_coding" to true.
""",
    "netflix_culture": """
This is a Netflix Cultural Fit round.
CRITICAL INSTRUCTIONS:
- Focus on Netflix culture: freedom and responsibility, high-performance, direct feedback, selflessness.
- Set "is_coding" to false.
""",
    "apple_technical": """
This is an Apple Technical Core round.
CRITICAL INSTRUCTIONS:
- Generate 1 coding problem focusing on system internals, concurrency, memory footprint, or hardware-software interaction.
- Set "is_coding" to true.
""",
    "apple_system_design": """
This is an Apple System Design round.
CRITICAL INSTRUCTIONS:
- Generate 1 architecture problem focusing on secure keys, media scaling, user privacy, or iCloud synchronization.
- Set "is_coding" to false.
""",
    "apple_behavioral": """
This is an Apple Behavioral round.
CRITICAL INSTRUCTIONS:
- Focus on attention to detail, pride of ownership, delivering high-quality user experience under pressure.
- Set "is_coding" to false.
"""
}

def _generate_fallback_questions(round_key: str, role: str, level: str, count: int, round_instruction: str = "") -> list[dict]:
    coding_pool = [
        {
            "question": "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
            "difficulty": "medium",
            "topic": "Arrays & Two Pointers",
            "what_to_look_for": "Sorting the array, using a three-pointer approach to achieve O(N^2) complexity, and skipping duplicate elements.",
            "is_coding": True
        },
        {
            "question": "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
            "difficulty": "medium",
            "topic": "Stacks & Design",
            "what_to_look_for": "Using an auxiliary stack to store minimums at each step, maintaining O(1) time complexity for all operations.",
            "is_coding": True
        },
        {
            "question": "Given a string s, find the length of the longest substring without repeating characters.",
            "difficulty": "medium",
            "topic": "Sliding Window",
            "what_to_look_for": "Using a sliding window with a hash set or map, updating pointers efficiently to run in O(N) time.",
            "is_coding": True
        },
        {
            "question": "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals.",
            "difficulty": "medium",
            "topic": "Intervals & Sorting",
            "what_to_look_for": "Sorting intervals by starting point and merging sequentially in O(N log N) time.",
            "is_coding": True
        },
        {
            "question": "Implement a Trie (Prefix Tree) with insert, search, and startsWith methods.",
            "difficulty": "medium",
            "topic": "Tries & Trees",
            "what_to_look_for": "Node structure with child dictionary/array and is_end flag, correct traversal for search and startsWith operations.",
            "is_coding": True
        },
        {
            "question": "Given the root of a binary tree, invert the tree (swap the left and right children of all nodes) and return its root.",
            "difficulty": "easy",
            "topic": "Trees",
            "what_to_look_for": "Simple recursive or level-order traversal, swapping left and right child pointers at each node.",
            "is_coding": True
        },
        {
            "question": "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
            "difficulty": "easy",
            "topic": "Binary Search Tree",
            "what_to_look_for": "Utilizing the BST property: if both target values are smaller than current node, traverse left; if larger, traverse right; otherwise current is LCA.",
            "is_coding": True
        },
        {
            "question": "Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. The algorithm must run in O(N) time.",
            "difficulty": "hard",
            "topic": "Hashing & Sequences",
            "what_to_look_for": "Using a hash set to lookup elements in O(1) time and checking sequences starting only from boundary elements (elements without num-1 in the set).",
            "is_coding": True
        }
    ]

    hld_pool = [
        {
            "question": "Design a URL shortening service like Bit.ly. Focus on scalability, read-to-write ratio, database choice, and unique ID generation.",
            "difficulty": "medium",
            "topic": "High-Level System Design",
            "what_to_look_for": "API endpoints design, database schemas, Base62 encoding or key generation service (KGS) for unique IDs, caching strategies (Redis).",
            "is_coding": False
        },
        {
            "question": "Design a rate limiter for a public-facing API. Discuss token bucket vs sliding window algorithms, and how to scale it in a distributed environment.",
            "difficulty": "medium",
            "topic": "High-Level System Design",
            "what_to_look_for": "Rate-limiting algorithms comparison, handling distributed locking and race conditions (e.g. using Redis Lua scripts), latency overhead.",
            "is_coding": False
        },
        {
            "question": "Design a notification service that sends push notifications, emails, and SMS to millions of users daily with low latency and high reliability.",
            "difficulty": "hard",
            "topic": "High-Level System Design",
            "what_to_look_for": "Decoupled asynchronous architecture using message queues (Kafka/RabbitMQ), provider rate limiting, retry mechanisms, idempotency.",
            "is_coding": False
        }
    ]

    lld_pool = [
        {
            "question": "Design and implement the class structure and APIs for a Parking Lot system. Support different spot sizes, vehicle types, and billing systems.",
            "difficulty": "medium",
            "topic": "Low-Level Design",
            "what_to_look_for": "Clean object-oriented hierarchy, SOLID design principles, separation of concerns, concurrency safety.",
            "is_coding": True
        },
        {
            "question": "Design and implement a Movie Ticket Booking System. Show the class definitions and how concurrent seat booking is handled.",
            "difficulty": "hard",
            "topic": "Low-Level Design",
            "what_to_look_for": "Handling concurrent transactions and preventing double-booking using locks (optimistic/pessimistic) or database constraints.",
            "is_coding": True
        },
        {
            "question": "Design and implement the key classes and interface design for a generic local cache library (like an LRU cache).",
            "difficulty": "medium",
            "topic": "Low-Level Design",
            "what_to_look_for": "Combining a doubly-linked list with a hash map to achieve O(1) get/put operations, generics, thread-safety.",
            "is_coding": True
        }
    ]

    technical_pool = [
        {
            "question": "Explain how indexing works in relational databases. What is the difference between B-Trees and Hash indexes, and how do they affect range queries?",
            "difficulty": "medium",
            "topic": "Databases",
            "what_to_look_for": "B-Tree node storage supporting range scans vs Hash index exact lookup speed but no range scans, index write overhead.",
            "is_coding": False
        },
        {
            "question": "What is the difference between a process and a thread? Explain how synchronization mechanisms like mutexes and semaphores prevent race conditions.",
            "difficulty": "medium",
            "topic": "Operating Systems",
            "what_to_look_for": "Isolated memory address spaces vs shared memory, context switching cost, synchronization primitives and deadlock prevention.",
            "is_coding": False
        },
        {
            "question": "Explain the difference between TCP and UDP. When would you choose one over the other for a real-time web application or streaming service?",
            "difficulty": "easy",
            "topic": "Networking",
            "what_to_look_for": "TCP connection establishment, reliability, flow control, ordering vs UDP lightweight, fast, no delivery guarantees.",
            "is_coding": False
        },
        {
            "question": "Explain the difference between optimistic locking and pessimistic locking. When and how would you apply each in a high-concurrency database system?",
            "difficulty": "medium",
            "topic": "Databases & Concurrency",
            "what_to_look_for": "Optimistic locking (version checking, low contention, better throughput) vs Pessimistic locking (db locks, high contention, prevents updates).",
            "is_coding": False
        },
        {
            "question": "Describe the concept of REST vs GraphQL. What are the key architectural differences, advantages, and trade-offs of each?",
            "difficulty": "easy",
            "topic": "API Design",
            "what_to_look_for": "REST resource-based endpoints, over-fetching/under-fetching vs GraphQL single endpoint, client-defined query schema, tooling complexity.",
            "is_coding": False
        },
        {
            "question": "What is garbage collection (GC) and how does it work in modern runtimes (like JVM or V8)? Discuss the difference between reference counting and mark-and-sweep.",
            "difficulty": "medium",
            "topic": "Memory Management",
            "what_to_look_for": "GC cycles, mark-and-sweep algorithm, cyclic dependency issues in reference counting, stop-the-world pauses.",
            "is_coding": False
        },
        {
            "question": "Explain the concept of microservices. How do microservices communicate (sync vs async), and how do you handle distributed transactions?",
            "difficulty": "hard",
            "topic": "System Architecture",
            "what_to_look_for": "REST/gRPC vs Message Queues, Saga pattern (orchestration/choreography), event-driven consistency, network latency.",
            "is_coding": False
        },
        {
            "question": "What are the SOLID design principles? Briefly explain each principle and why they are important in object-oriented software development.",
            "difficulty": "medium",
            "topic": "Software Design",
            "what_to_look_for": "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion with clear definitions.",
            "is_coding": False
        }
    ]

    behavioral_pool = [
        {
            "question": "Tell me about a time when you had to deal with ambiguity in a project as a {level} {role}. How did you define the path forward for yourself and the team?",
            "difficulty": "medium",
            "topic": "Ambiguity & Ownership",
            "what_to_look_for": "Proactive communication, breaking down vague requirements, building small MVP spikes, handling uncertainty.",
            "is_coding": False
        },
        {
            "question": "Describe a situation where you had a strong technical disagreement with a colleague or lead during your work as a {role}. How did you resolve it?",
            "difficulty": "medium",
            "topic": "Collaboration & Conflict",
            "what_to_look_for": "Professionalism, active listening, objective data/benchmarks, compromise, and executing the chosen path.",
            "is_coding": False
        },
        {
            "question": "Tell me about a time you took ownership of a critical issue or task that was outside your immediate responsibility as a {role}. What was the outcome?",
            "difficulty": "medium",
            "topic": "Leadership & Impact",
            "what_to_look_for": "Proactivity, stepping up to solve problems, collaborating across teams, long-term impact.",
            "is_coding": False
        },
        {
            "question": "Describe a project you worked on as a {role} that failed or did not meet its expectations. What went wrong, what was your role, and what did you learn?",
            "difficulty": "medium",
            "topic": "Growth Mindset",
            "what_to_look_for": "Honest reflection, taking responsibility, post-mortem analysis, specific changes implemented in subsequent work.",
            "is_coding": False
        },
        {
            "question": "How do you prioritize your tasks when faced with multiple tight deadlines and competing stakeholder demands as a {level} developer?",
            "difficulty": "easy",
            "topic": "Time Management",
            "what_to_look_for": "Value-based prioritization, communication of timelines, negotiation of scope, avoiding burnout.",
            "is_coding": False
        },
        {
            "question": "Tell me about a time you had to learn a completely new technology or domain very quickly to deliver a project as a {role}. How did you approach it?",
            "difficulty": "medium",
            "topic": "Adaptability",
            "what_to_look_for": "Structured learning path, utilizing documentation/tutorials, pairing, building small prototypes, delivering on time.",
            "is_coding": False
        },
        {
            "question": "Why do you want to join our company, and how do you see yourself contributing to our mission and culture as a {level} {role}?",
            "difficulty": "easy",
            "topic": "Cultural Alignment",
            "what_to_look_for": "Genuine interest in company product/mission, understanding of company values, alignment of career goals.",
            "is_coding": False
        },
        {
            "question": "Tell me about a time you mentored a junior team member or helped a colleague overcome a difficult technical obstacle in your role as a {role}. What was your approach?",
            "difficulty": "medium",
            "topic": "Mentorship & Teamwork",
            "what_to_look_for": "Patience, guiding instead of just giving answers, building psychological safety, documentation.",
            "is_coding": False
        }
    ]

    resume_pool = [
        {
            "question": "Walk me through the architecture of the most technically complex project listed on your resume. What was your specific contribution as a {role}?",
            "difficulty": "medium",
            "topic": "Project Architecture",
            "what_to_look_for": "Clear explanation of backend/frontend structure, databases, protocols, personal design decisions.",
            "is_coding": False
        },
        {
            "question": "On your resume, you listed experience relevant to {role} development. What is a major trade-off or limitation of one of the core technologies you used, and how did you mitigate it?",
            "difficulty": "medium",
            "topic": "Technology Decisions",
            "what_to_look_for": "In-depth understanding of library/framework downsides, comparative knowledge of other tools.",
            "is_coding": False
        },
        {
            "question": "Can you describe a major bug, performance bottleneck, or production issue you encountered in one of your projects? How did you diagnose and resolve it as a {role}?",
            "difficulty": "medium",
            "topic": "Problem Solving",
            "what_to_look_for": "Logical troubleshooting process, profiling/monitoring tools used, permanent fix implementation.",
            "is_coding": False
        },
        {
            "question": "Looking at your resume projects, what is one major feature or architectural choice you would implement differently today if you had to rebuild it from scratch as a {level} engineer, and why?",
            "difficulty": "medium",
            "topic": "Reflection & Learning",
            "what_to_look_for": "Critical evaluation of past design decisions, incorporation of new learnings and industry patterns.",
            "is_coding": False
        },
        {
            "question": "How did you ensure the quality, reliability, and security of the systems you built in your previous roles or projects as a {role}?",
            "difficulty": "easy",
            "topic": "Quality & Testing",
            "what_to_look_for": "Testing strategies (unit/integration/E2E), CI/CD pipelines, static analysis, security best practices (OWASP).",
            "is_coding": False
        },
        {
            "question": "Could you elaborate on a project from your resume where you had to collaborate closely with product managers, designers, or other non-technical stakeholders to deliver a feature?",
            "difficulty": "easy",
            "topic": "Cross-Functional Collaboration",
            "what_to_look_for": "Translating tech concepts, gathering feedback, handling scope changes, empathetic communication.",
            "is_coding": False
        }
    ]

    is_behavioral = round_key in ["hr", "cultural", "googleyness", "meta_behavioral", "amazon_leadership", "microsoft_behavioral", "netflix_culture", "apple_behavioral"] or round_key.endswith("_behavioral")
    is_system_design = "system_design" in round_key
    is_resume = round_key == "resume"
    is_coding = 'is_coding" to true' in round_instruction.lower() or round_key == "dsa" or round_key.endswith("_coding") or round_key.endswith("_technical")

    if is_system_design:
        hld_count = count // 2
        lld_count = count - hld_count
        sampled_hld = random.sample(hld_pool, min(hld_count, len(hld_pool)))
        sampled_lld = random.sample(lld_pool, min(lld_count, len(lld_pool)))
        selected = sampled_hld + sampled_lld
    elif is_coding:
        selected = random.sample(coding_pool, min(count, len(coding_pool)))
    elif is_behavioral:
        selected = random.sample(behavioral_pool, min(count, len(behavioral_pool)))
    elif is_resume:
        selected = random.sample(resume_pool, min(count, len(resume_pool)))
    else:
        selected = random.sample(technical_pool, min(count, len(technical_pool)))

    combined_pool = coding_pool if is_coding else (hld_pool + lld_pool if is_system_design else (behavioral_pool if is_behavioral else (resume_pool if is_resume else technical_pool)))
    while len(selected) < count:
        q = random.choice(combined_pool)
        if q not in selected:
            selected.append(q)
        else:
            selected.append(q.copy())

    results = []
    for q in selected:
        q_copy = q.copy()
        if "{role}" in q_copy["question"]:
            q_copy["question"] = q_copy["question"].format(role=role, level=level)
        elif "{level}" in q_copy["question"]:
            q_copy["question"] = q_copy["question"].format(role=role, level=level)
        results.append(q_copy)

    return results

async def generate_questions(
    round_key: str,
    role: str,
    level: str,
    profile: dict,
    job_description: str = "",
    ai_service_url: str = None,
    groq_api_key: str = None,
    company: str = "",
    scraped_context: str = "",
    count: int = None,
    dynamic_cfg: dict = None,
    dynamic_instruction: str = None
) -> list[dict]:

    instantiated_cfg = dynamic_cfg
    instantiated_instruction = dynamic_instruction

    if "_" in round_key and not instantiated_cfg:
        parts = round_key.split("_")
        suffix = parts[-1]
        prefix = "_".join(parts[:-1])
        
        if suffix in ["coding", "system_design", "behavioral"] and prefix not in ["google", "meta", "amazon", "microsoft", "netflix", "apple"]:
            company_title = prefix.capitalize()
            
            target_count = count if count is not None else (2 if suffix == "behavioral" else 1)
            
            if suffix == "coding":
                instantiated_cfg = {
                    "name": f"{company_title} Technical Coding",
                    "count": target_count,
                    "task": "question_generation",
                    "prompt_hint": f"{company_title}-style algorithmic coding problem, efficiency, optimization, standard of coding questions at {company_title}."
                }
                instantiated_instruction = f"""
This is a {company_title} Technical Coding round.
CRITICAL INSTRUCTIONS:
- Generate {target_count} algorithmic coding problem(s) in the style of actual {company_title} interview questions.
- Focus on correct implementation, complexity analysis, data structures, and edge cases.
- Set "is_coding" to true.
"""
            elif suffix == "system_design":
                instantiated_cfg = {
                    "name": f"{company_title} System Design",
                    "count": target_count,
                    "task": "question_generation",
                    "prompt_hint": f"{company_title}-style system design and distributed architecture problem, scalability, caching, databases, reliability."
                }
                instantiated_instruction = f"""
This is a {company_title} System Design round.
CRITICAL INSTRUCTIONS:
- Generate {target_count} large-scale architecture or system design problem(s) in the style of actual {company_title} interviews.
- Focus on scaling, databases, trade-offs, and microservices.
- Set "is_coding" to false.
"""
            elif suffix == "behavioral":
                instantiated_cfg = {
                    "name": f"{company_title} Behavioral",
                    "count": target_count,
                    "task": "hr",
                    "prompt_hint": f"{company_title} cultural values, collaboration, handling challenges, past engineering experience."
                }
                instantiated_instruction = f"""
This is a {company_title} Behavioral and Cultural Fit round.
CRITICAL INSTRUCTIONS:
- Focus on behavior, collaboration, past engineering experience, leadership, and alignment with {company_title}'s culture and values.
- Set "is_coding" to false.
"""

    cfg = instantiated_cfg or ROUND_CONFIGS.get(round_key, ROUND_CONFIGS["technical"])
    if count is not None:
        cfg = cfg.copy()
        cfg["count"] = count
    
    round_instruction = instantiated_instruction or dynamic_instruction or ROUND_INSTRUCTIONS.get(round_key, "")

    tech_stack = profile.get("tech_stack", [])
    skills = profile.get("skills", [])
    projects = [p.get("name", "") for p in profile.get("projects", []) if isinstance(p, dict)] if isinstance(profile.get("projects"), list) else []

    behavioral_keys = ["hr", "cultural", "googleyness", "meta_behavioral", "amazon_leadership", "microsoft_behavioral", "netflix_culture", "apple_behavioral"]
    is_behavioral = round_key in behavioral_keys or round_key.endswith("_behavioral")

    if is_behavioral:
        persona = f"You are an HR recruiter, hiring manager, or cultural interviewer conducting a {cfg['name']} for a {level} {role} position"
        if company:
            persona += f" at {company}"
        persona += "."

        prompt = f"""
{persona}
Speak like a real interviewer talking directly to the candidate.
Write every question in a natural, conversational style using direct address like "you" or "your experience".
Do not sound robotic, instructional, or like a list of prompts.
Do not mention that you are an AI, a model, or an assistant.

Candidate Role: {role}
Candidate Level: {level}
Job Description Context: {job_description[:1000] if job_description else 'Not provided'}
Resume Profile Context: {json.dumps(profile) if profile else 'Not provided'}

{round_instruction}

Generate exactly {cfg['count']} interview questions.
CRITICAL: You MUST adjust the difficulty, complexity, and theme of your questions to be perfectly tailored for a {level}-level {role}.
Calibrate your questions according to the candidate's resume/profile details and the Job Description context. Tailor the scenarios to match the responsibilities of the role and company context if provided.

Return ONLY a valid JSON array:
[
  {{
    "question": "the full question text",
    "difficulty": "easy|medium|hard",
    "topic": "topic being tested",
    "what_to_look_for": "what a strong answer covers",
    "is_coding": false
  }}
]

Return ONLY the JSON array. No explanation. No markdown.
"""
    else:
        persona = f"You are a senior {role} engineer conducting a {cfg['name']} interview"
        if company:
            persona += f" at {company}"
        persona += "."

        prompt = f"""
{persona}
Speak like a real interviewer talking directly to the candidate.
Write every question in a natural, conversational style using direct address like "you" or "your experience".
Do not sound robotic, instructional, or like a list of prompts.
Do not mention that you are an AI, a model, or an assistant.

Candidate Role: {role}
Candidate Level: {level}
Candidate Tech Stack: {tech_stack}
Candidate Skills: {skills}
Candidate Projects: {projects}
Job Description Context: {job_description[:1000] if job_description else 'Not provided'}
Full Resume Profile Context: {json.dumps(profile) if profile else 'Not provided'}

{round_instruction}

Generate exactly {cfg['count']} interview questions appropriate for a {level} {role} engineer.
Vary difficulty. Make them specific and realistic — not generic.
You MUST adjust the difficulty, complexity, and technical depth of your questions to be perfectly tailored for a {level}-level {role}.
Calibrate and adapt your questions according to the candidate's resume details and the Job Description context (e.g. prioritize technologies mentioned in the JD or candidate stack).

Return ONLY a valid JSON array:
[
  {{
    "question": "the full question text",
    "difficulty": "easy|medium|hard",
    "topic": "topic being tested",
    "what_to_look_for": "what a strong answer covers",
    "is_coding": true_or_false_based_on_instructions
  }}
]

Return ONLY the JSON array. No explanation. No markdown.
"""

    if scraped_context:
        context_str = f"\n\nReal-world interview context from the web for {company}:\n{scraped_context}\nUse this context to calibrate the questions to reflect the actual types of questions and experiences candidates face at {company}.\n\n"
        prompt = prompt.replace("Return ONLY a valid JSON array:", context_str + "Return ONLY a valid JSON array:")

    raw = await llm(prompt, task=cfg["task"], ai_service_url=ai_service_url, groq_api_key=groq_api_key)
    questions = _parse(raw)

    # Fallback if parsing fails
    if not questions:
        questions = _generate_fallback_questions(
            round_key=round_key,
            role=role,
            level=level,
            count=cfg["count"],
            round_instruction=round_instruction
        )
    return questions