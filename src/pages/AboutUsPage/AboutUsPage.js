import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AboutUsPage.css';

const dynableExperienceSteps = [
  {
    icon: '🔎',
    title: 'Step 1: What are you allergic to?',
    content: (
      <>
        <p>That's the first thing we ask. Because before we suggest a single product, recipe, or grocery item, we want to know what you need to avoid.</p>
        <p>You'll see options like <strong>milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish,</strong> and <strong>sesame</strong> — the most common allergens — but you can add many others as well.</p>
        <p>These are the big ones — the Top 9 allergens responsible for the majority of serious reactions.</p>
        <p>But we go far beyond that.<br /> Maybe you're allergic to mustard, corn, celery, or even something unexpected like black pepper. Dynable allows you to add those too — because we know that "less common" doesn't mean "less dangerous."</p>
        <p>Once you've told us what to watch out for, we filter everything on the site automatically. You don't have to scan ingredient lists, decode labels, or worry about hidden triggers. We've got your back.</p>
      </>
    ),
  },
  {
    icon: '🍽️',
    title: 'Step 2: Explore Freely',
    content: (
      <>
        <ul>
          <li><strong>Recipes</strong> you can safely enjoy, no guessing required.</li>
          <li><strong>Grocery products</strong> that are clearly labeled with allergy info — only showing options that meet your needs.</li>
          <li><strong>Safe substitutions</strong> in recipes where an ingredient you're avoiding is normally used.</li>
        </ul>
        <p>And we don't limit you to a narrow selection — if you want to search for Thai food, baked goods, or protein-packed breakfasts, go for it. Dynable adapts your results behind the scenes so the experience always feels normal — just safer.</p>
      </>
    ),
  },
  {
    icon: '🛒',
    title: 'Step 3: Shop with Confidence',
    content: (
      <>
        <p>Found a meal you like? Every ingredient in that recipe links to verified grocery products you can order directly, whether for delivery or in-store pickup. You can even save recipes and products to your personal list, making future shopping easier and faster.</p>
      </>
    ),
  },
  {
    icon: '🌱',
    title: 'Step 4: Make Dynable Your Own',
    content: (
      <>
        <ul>
          <li>Cooking for yourself or a child with multiple allergies,</li>
          <li>Trying a new elimination diet,</li>
          <li>Or just need extra peace of mind…</li>
        </ul>
        <p>Dynable grows with you. You'll receive notifications when new safe products or recipes are added, and you can keep a running list of trusted meals to fall back on anytime.</p>
        <p><strong>This is more than just a food platform. It's your personal allergy-aware kitchen assistant.</strong><br /> And the more you use it, the smarter — and safer — it gets.</p>
      </>
    ),
  },
];

const AboutUsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Interactive Dynable Experience step state
  const [experienceStep, setExperienceStep] = useState(0);
  const isFirstStep = experienceStep === 0;
  const isLastStep = experienceStep === dynableExperienceSteps.length - 1;

  // Determine which page to show based on URL
  const getPageContent = () => {
    const path = location.pathname;
    
    if (path === '/about') {
      return (
        <main className="aboutus-content" key="about">
          <div className="aboutus-title-intro">
            <div className="aboutus-slogan">Know What's Inside. Eat with Confidence</div>
          </div>
          <section className="aboutus-section aboutus-section-row">
            <div className="aboutus-section-text">
              <h1>About Dynable</h1>
              <h2>Our Mission</h2>
              <p>We believe everyone deserves access to safe, delicious food — no matter their dietary restrictions. Dynable exists to eliminate the guesswork, fear, and frustration that come with food allergies by providing a smarter, personalized platform that connects people to recipes, products, and solutions they can trust.</p>
            </div>
            <div className="aboutus-section-media">
              <div className="aboutus-video-placeholder">
                <span>Video Coming Soon</span>
              </div>
            </div>
          </section>
          <section className="aboutus-section aboutus-section-row">
            <div className="aboutus-section-text" style={{width: '100%'}}>
              <h2>Why We Started Dynable</h2>
              <p>Millions of people live with food allergies — and yet most food delivery, grocery, and recipe sites overlook their needs.</p>
              <ul>
                <li>A parent scrambling to find safe snacks after your child's first allergic reaction…</li>
                <li>An adult just diagnosed with celiac, dairy, or black pepper allergy and unsure where to start…</li>
                <li>Someone who feels frustrated and restricted by your new food limitations…</li>
              </ul>
              <div className="aboutus-subsection" style={{margin: '32px 0', maxWidth: '100%'}}>
                <h3><strong>You're not alone.</strong></h3>
                <p>At Dynable, we've met people who:</p>
                <ul>
                  <li>Ate only five meals on repeat because they didn't know what else was safe.</li>
                  <li>Had to memorize every label and still ended up sick after cross-contamination.</li>
                  <li>Stopped going out to eat entirely due to fear of hidden allergens.</li>
                </ul>
                <p>We're building this platform for them — and for you.</p>
              </div>
            </div>
          </section>
          <section className="aboutus-section aboutus-section-row">
            <div className="aboutus-section-text">
              <h2>How Dynable Improves Lives</h2>
              <ul>
                <li>🛒 <strong>Product Discovery</strong>: Instantly filter out allergens and discover grocery items you never knew were safe.</li>
                <li>🍽️ <strong>Recipe Personalization</strong>: Find adaptable meals with safe substitutions built right in.</li>
                <li>🧠 <strong>Peace of Mind</strong>: Stop living in fear of the next bite. Start enjoying food again.</li>
              </ul>
            </div>
            <div className="aboutus-section-media">
              <div className="aboutus-image-placeholder">Image Placeholder</div>
            </div>
          </section>
        </main>
      );
    } else if (path === '/about/team') {
      return (
        <main className="aboutus-content" key="team">
          <div className="aboutus-title-intro">
            <div className="aboutus-slogan">Meet the Team</div>
          </div>
          <section className="aboutus-section aboutus-section-row">
            <div className="aboutus-team-cards">
              <div className="aboutus-team-card">
                <div className="aboutus-team-avatar">👨‍💻</div>
                <div className="aboutus-team-info">
                  <h3>Avitosh Totaram</h3>
                  <span className="aboutus-team-title">Founder & CEO</span>
                  <p>Avitosh is a mechanical engineer turned software entrepreneur who knows firsthand the challenges of managing food allergies. After struggling to find safe, diverse meal options, he set out to build a smarter, personalized platform that empowers people to eat with confidence — not caution. With a deep commitment to accessibility and innovation, he's leading Dynable's mission to transform how we approach food and safety.</p>
                </div>
              </div>
              <div className="aboutus-team-card">
                <div className="aboutus-team-avatar">💡</div>
                <div className="aboutus-team-info">
                  <h3>Monferd Collin</h3>
                  <span className="aboutus-team-title">Full-Stack Software Engineer</span>
                  <p>Monferd holds a degree in Science, Technology, and Society (BS) from NYU and brings both technical expertise and personal passion to Dynable. His motivation is rooted in his desire to help his own family easily access allergy-friendly foods without stress. As a full-stack software engineer, Monferd ensures the platform is fast, intuitive, and responsive for every user — especially those like his loved ones.</p>
                </div>
              </div>
              <div className="aboutus-team-card">
                <div className="aboutus-team-avatar">📘</div>
                <div className="aboutus-team-info">
                  <h3>Justin Linzan</h3>
                  <span className="aboutus-team-title">Full-Stack Software Engineer</span>
                  <p>Justin is currently studying software engineering and finance at Columbia University. His sister's struggle with food allergies has given him a personal understanding of the limitations and daily worries so many people face. Motivated by his commitment to a healthy lifestyle, Justin brings a thoughtful, user-centered perspective to Dynable's engineering team, helping build features that improve real lives through food accessibility.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      );
    } else if (path === '/about/experience') {
      return (
        <main className="aboutus-content" key="experience">
          <div className="aboutus-title-intro">
            <div className="aboutus-slogan">Your Experience with Dynable</div>
            <div className="aboutus-experience-subtitle">
              <h2>The Dynable Experience: Personalized from First Click</h2>
              <p>Visiting Dynable isn't like opening just another recipe site. It's like walking into a kitchen that already knows what you <em>can</em> eat — and makes sure nothing unsafe even makes it to the table.</p>
            </div>
          </div>
          <section className="aboutus-section aboutus-section-row">
            <div className="aboutus-experience-steps" style={{width: '100%', alignItems: 'center', position: 'relative'}}>
              <div className="aboutus-experience-stepper-row">
                <button
                  className="aboutus-experience-arrow-btn"
                  onClick={() => setExperienceStep(experienceStep - 1)}
                  disabled={isFirstStep}
                  aria-label="Previous Step"
                >
                  &#8592;
                </button>
                <div className="aboutus-experience-step" style={{maxWidth: 600, width: '100%'}}>
                  <div className="aboutus-step-icon">{dynableExperienceSteps[experienceStep].icon}</div>
                  <div>
                    <h4>{dynableExperienceSteps[experienceStep].title}</h4>
                    {dynableExperienceSteps[experienceStep].content}
                  </div>
                </div>
                <button
                  className="aboutus-experience-arrow-btn"
                  onClick={() => setExperienceStep(experienceStep + 1)}
                  disabled={isLastStep}
                  aria-label="Next Step"
                >
                  &#8594;
                </button>
              </div>
              <div className="aboutus-experience-dots" style={{display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center'}}>
                {dynableExperienceSteps.map((_, idx) => (
                  <span
                    key={idx}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: idx === experienceStep ? '#3a7bd5' : '#b3d1f7',
                      display: 'inline-block',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>
      );
    }
    
    // Default fallback
    return (
      <main className="aboutus-content" key="about">
        <div className="aboutus-title-intro">
          <div className="aboutus-slogan">Know What's Inside. Eat with Confidence</div>
        </div>
        <section className="aboutus-section aboutus-section-row">
          <div className="aboutus-section-text">
            <h1>About Dynable</h1>
            <h2>Our Mission</h2>
            <p>We believe everyone deserves access to safe, delicious food — no matter their dietary restrictions. Dynable exists to eliminate the guesswork, fear, and frustration that come with food allergies by providing a smarter, personalized platform that connects people to recipes, products, and solutions they can trust.</p>
          </div>
          <div className="aboutus-section-media">
            <div className="aboutus-video-placeholder">
              <span>Video Coming Soon</span>
            </div>
          </div>
        </section>
      </main>
    );
  };

  return (
    <div className="aboutus-outer-border">
      <div className="aboutus-inner-border">
        {getPageContent()}
        
        {/* Continue Button */}
        <div className="aboutus-continue-btn-container">
          <button className="aboutus-continue-btn" onClick={() => navigate('/')}>
            Continue to Dynable
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage; 