// ============================================================
// BVM CONTENT FILE
// ============================================================
// This file contains all the text content for the BVM web app.
// To update content, edit the text in this file only.
// Do not edit index.html or module.html unless changing layout.
// ============================================================

const BVM_DATA = {

  introduction: {
    id: "introduction",
    title: "Best Version of Me",
    subtitle: "Introduction",
    icon: "⭐",
    color: "#1B4F6B",
    colorLight: "#D6E9F0",
    description: "Meet the program, understand what self-awareness means, and discover the six skills you'll explore today.",
    screens: [
      {
        type: "title",
        heading: "Welcome to Best Version of Me",
        body: "This program is about understanding yourself — your thoughts, feelings, strengths, and the choices you make every day.",
        note: null
      },
      {
        type: "acknowledgement",
        heading: "Acknowledgement of Country",
        body: "We would like to acknowledge the Kaurna people as the custodians of the lands and waters of the Adelaide region, on which we meet today. We pay respect to elders both past and present. We acknowledge and respect the Kaurna people's cultural, spiritual, physical and emotional connection with their land, waters and community.",
        note: null
      },
      {
        type: "definition",
        heading: "What is Self-Awareness?",
        body: "Self-awareness is understanding yourself — your thoughts, feelings, and actions. It's like looking in a mirror and seeing yourself clearly, knowing what you're good at, what you need to work on, and how you affect others. It's a bit like being your own detective, noticing and understanding what makes you, you.",
        note: null
      },
      {
        type: "skills-overview",
        heading: "Our Favourite 6 Skills",
        body: "Today we'll explore six skills that build your self-awareness. You can tackle them in any order.",
        skills: [
          { name: "Self-Compassion", desc: "Talk to yourself with the same kindness you'd offer a best friend.", icon: "🤍" },
          { name: "Honesty", desc: "Tell the truth to yourself about how you feel and what you do.", icon: "🌿" },
          { name: "Emotional Awareness", desc: "Pay attention to your thoughts and feelings. Name your feelings to tame your feelings.", icon: "💭" },
          { name: "Seeking Feedback", desc: "Ask for and listen to feedback from others to help you grow.", icon: "🔄" },
          { name: "Mindfulness", desc: "Stay present and aware of your emotions.", icon: "🧘" },
          { name: "Self-Reflection", desc: "Reflect on your experiences and learn from them to grow.", icon: "🔍" }
        ]
      },
      {
        type: "activity",
        heading: "Welcome Activity: Line Up",
        activity: "Stand on either side of a line in the middle of the room, facing each other. Listen to each question and position yourself to show your answer.",
        note: "Facilitator note: Use this to warm up the group and get them moving before diving into modules."
      }
    ]
  },

  modules: [
    {
      id: "self-compassion",
      title: "Self-Compassion",
      subtitle: "Skill 01",
      icon: "🤍",
      color: "#1B4F6B",
      colorLight: "#D6E9F0",
      tagline: "Talk to yourself like a best friend.",
      description: "Talk to yourself with the same kindness you would with a best friend. Learn to be your own greatest supporter.",
      screens: [
        {
          type: "definition",
          heading: "What is Self-Compassion?",
          body: "Self-compassion isn't about being \"soft\" or making excuses. It's about treating yourself the way you'd treat a friend. Building self-compassion helps with resilience, emotional awareness, and bouncing back from mistakes.",
          note: null
        },
        {
          type: "activity",
          heading: "Activity: Compassion Web",
          activity: "Holding a strand of wool, shout out something you like about yourself, then throw the wool pile to someone else — but don't let go of your strand! Watch the web grow as everyone shares.",
          note: "Facilitator note: This activity visually shows connection and builds a positive, supportive atmosphere."
        },
        {
          type: "learning",
          heading: "What We Learned",
          body: "Self-compassion isn't about being 'soft' or making excuses. It's about treating yourself the way you'd treat a friend. Building self-compassion helps with resilience, emotional awareness, and bouncing back from mistakes.",
          note: null
        }
      ]
    },

    {
      id: "honesty",
      title: "Honesty",
      subtitle: "Skill 02",
      icon: "🌿",
      color: "#2A7F62",
      colorLight: "#D6EDE5",
      tagline: "Tell the truth to yourself.",
      description: "Telling the truth to yourself about how you feel and what you do. Honesty is the foundation of growth.",
      screens: [
        {
          type: "definition",
          heading: "What is Honesty?",
          body: "Honesty means telling the truth — to others, and to yourself — about how you feel and what you do. It takes courage, but it's one of the most important skills for real self-awareness.",
          note: null
        },
        {
          type: "activity",
          heading: "Activity: Line of Honesty",
          activity: "Answer each question by positioning yourself in the room. One side of the line is 'Always', the other is 'Never'. Be honest — there are no wrong answers!",
          note: "Facilitator note: Read each scenario aloud and give students time to move and reflect before the next one."
        },
        {
          type: "scenarios",
          heading: "Honesty Scenarios",
          scenarios: [
            "A friend tells you a secret, but someone else asks you about it. Do you keep it private?",
            "Your best friend tells a joke that isn't funny, but they look excited for your reaction. Do you laugh anyway?",
            "A teacher gives you credit for something you didn't do. Do you correct them or enjoy the moment?",
            "Your teacher asks if you like their new shoes, but you don't. Do you tell the truth?",
            "You accidentally break something at your homestay, but no one saw. Do you admit it?",
            "You're talking to someone and they have something stuck in their teeth. Do you tell them?",
            "You're part of a group chat where people are being mean. Do you leave it, or report it?"
          ]
        },
        {
          type: "learning",
          heading: "What We Learned",
          body: "Practising honesty helps build self-awareness by allowing us to recognise our true feelings, take responsibility for our actions, and understand how our choices align with our values.",
          note: null
        }
      ]
    },

    {
      id: "emotional-awareness",
      title: "Emotional Awareness",
      subtitle: "Skill 03",
      icon: "💭",
      color: "#5B6BAD",
      colorLight: "#DDE1F4",
      tagline: "Name your feelings to tame your feelings.",
      description: "Pay attention to your thoughts and feelings to understand yourself better. Name your feelings to tame your feelings.",
      screens: [
        {
          type: "definition",
          heading: "What is Emotional Awareness?",
          body: "Emotional awareness helps us understand what's really going on beneath the surface. The better we understand our emotions, the better we understand ourselves and communicate with others. Take the time to name your inner feelings, to help tame them.",
          note: null
        },
        {
          type: "activity",
          heading: "Activity: Emotion Charades",
          activity: "Looking for some brave volunteers to act out an emotion on the card, without using words! The rest of the group guesses what emotion is being shown.",
          note: "Facilitator note: Keep it light and fun. Debrief by asking what clues helped them guess the emotion."
        },
        {
          type: "callout",
          heading: "The Anger Iceberg",
          body: "In our game of emotion charades, we acted out feelings we might see on the outside. But just like an iceberg, one emotion can hold so much more underneath the surface. Anger, for example, might really be hurt, fear, embarrassment, or loneliness hiding beneath.",
          note: null
        },
        {
          type: "learning",
          heading: "What We Learned",
          body: "Emotional awareness helps us understand what's really going on beneath the surface. The better we understand our emotions, the better we understand ourselves and communicate with others.",
          note: null
        }
      ]
    },

    {
      id: "seeking-feedback",
      title: "Seeking Feedback",
      subtitle: "Skill 04",
      icon: "🔄",
      color: "#8B5A9E",
      colorLight: "#EDDDFA",
      tagline: "Glows and Grows help us get better.",
      description: "Ask for and listen to feedback from others to help you grow. Every Glow and Grow is a chance to improve.",
      screens: [
        {
          type: "definition",
          heading: "What is Seeking Feedback?",
          body: "Seeking feedback means asking for and listening to what others notice about us — to help us grow. Feedback isn't criticism. It's a tool for learning.",
          note: null
        },
        {
          type: "activity",
          heading: "Activity: Glow & Grow",
          activity: "Let's draw a picture in 15 seconds! If asked, give feedback using the Glow & Grow method:\n• GLOW → Something they did well\n• GROW → One way they could improve",
          note: "Facilitator note: This quick activity makes feedback feel safe and structured. Emphasise that both parts are equally important."
        },
        {
          type: "learning",
          heading: "What We Learned",
          body: "Giving and receiving feedback helps us grow by recognising our strengths (\"Glows\") and areas to improve (\"Grows\"). Practising this builds self-awareness, confidence, and a mindset that sees feedback as a tool for learning — not criticism.",
          note: null
        }
      ]
    },

    {
      id: "mindfulness",
      title: "Mindfulness",
      subtitle: "Skill 05",
      icon: "🧘",
      color: "#3A8FA3",
      colorLight: "#D6EFF5",
      tagline: "Stay present. Stay aware.",
      description: "Stay present and aware of your emotions. Mindfulness helps you respond thoughtfully instead of reacting.",
      screens: [
        {
          type: "definition",
          heading: "What is Mindfulness?",
          body: "Mindfulness means staying present and aware of what's happening — in your body, your mind, and your surroundings. It helps reduce stress, enhance focus, improve emotional regulation, and encourage a more positive outlook.",
          note: null
        },
        {
          type: "activity",
          heading: "Activity: Ten Mindfulness Mini's",
          activity: "Follow along to try ten simple, quick ways to calm your mind, stay present, and reset your focus — anywhere, anytime!",
          note: "Facilitator note: Lead each mini slowly. Invite students to close their eyes if comfortable."
        },
        {
          type: "list",
          heading: "The Ten Mindfulness Mini's",
          items: [
            { num: "1", label: "Posture", desc: "Sit up tall and feel grounded." },
            { num: "2", label: "Deep Breathing", desc: "Breathe in slowly, then out slowly." },
            { num: "3", label: "Balance", desc: "Stand on one foot and find your centre." },
            { num: "4", label: "Affirmation", desc: "Say to yourself: \"I am calm and at peace.\"" },
            { num: "5", label: "Smile", desc: "Let a gentle smile come to your face." },
            { num: "6", label: "Observation", desc: "Notice five things you can see right now." },
            { num: "7", label: "Colour", desc: "Find something blue in the room." },
            { num: "8", label: "Hand Tracing", desc: "Trace your fingers slowly with the other hand." },
            { num: "9", label: "Listening", desc: "Close your eyes and notice every sound." },
            { num: "10", label: "Your Favourite", desc: "Which one worked best for you?" }
          ]
        },
        {
          type: "learning",
          heading: "What We Learned",
          body: "Mindfulness helps reduce stress, enhance focus and concentration, improve emotional regulation, reduce muscle tension, encourage a positive outlook and improved self-esteem.",
          note: null
        }
      ]
    },

    {
      id: "self-reflection",
      title: "Self-Reflection",
      subtitle: "Skill 06",
      icon: "🔍",
      color: "#9E6B3A",
      colorLight: "#F5E8D6",
      tagline: "Look back to move forward.",
      description: "Reflect on your experiences and learn from them to grow. Looking back helps you move forward with intention.",
      screens: [
        {
          type: "definition",
          heading: "What is Self-Reflection?",
          body: "Self-reflection is the practice of thinking carefully about your own thoughts, feelings, and actions — and learning from them. It's how we turn experiences into growth.",
          note: null
        },
        {
          type: "activity",
          heading: "Activity: Journal Reflection",
          activity: "Please complete these 3 questions in your BVM Journal on page 1. Take your time — there are no right or wrong answers.",
          note: "Facilitator note: Give students quiet time for this. Gentle music can help create the right atmosphere."
        },
        {
          type: "learning",
          heading: "What We Learned",
          body: "Journaling helps build self-awareness by giving us space to reflect on our thoughts, feelings, and experiences. Writing things down makes it easier to recognise patterns, understand emotions, and make choices that align with our values.",
          note: null
        }
      ]
    }
  ]
};