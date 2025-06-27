import { useState } from 'react'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('input') // 'input', 'recipes', 'walkthrough', 'loading'
  const [ingredients, setIngredients] = useState('')
  const [availableTools, setAvailableTools] = useState('')
  const [recipes, setRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiConfig, setApiConfig] = useState({
    endpoint: 'https://api.openai.com/v1/chat/completions', // Default OpenAI endpoint
    apiKey: ''
  })
  const [showApiConfig, setShowApiConfig] = useState(false)

  // Enhanced API call to OpenAI
  // Enhanced API call to OpenAI
const callOpenAI = async (prompt) => {
  try {
    const response = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response message found.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to connect to OpenAI: ${error.message}`);
  }
}


  const generateRecipePrompt = (ingredientsList, toolsList) => {
    return `You are a professional chef assistant. I have the following ingredients and kitchen tools available:

INGREDIENTS:
${ingredientsList}

AVAILABLE KITCHEN TOOLS:
${toolsList || 'Basic kitchen tools (knife, cutting board, stove, oven, basic cookware)'}

Please suggest at least 2 practical recipes I can make with these ingredients and tools. We do not need to use all of them! For each recipe, provide:

1. Recipe name
2. Brief description (1-2 sentences)
3. Estimated cooking time
4. Difficulty level (Easy/Medium/Hard)
5. Complete list of ingredients needed (highlight any missing ingredients)
6. Step-by-step cooking instructions (numbered, and should be practical and easy to follow, each step description should be concise)
7. Any tips for variations and safety

Format your response as JSON with this structure:
{
  "recipes": [
    {
      "id": 1,
      "name": "Recipe Name",
      "description": "Brief description",
      "cookingTime": "X minutes",
      "difficulty": "Easy/Medium/Hard",
      "ingredients": ["ingredient1", "ingredient2"],
      "missingIngredients": ["optional missing ingredients"],
      "steps": ["Step 1 instructions", "Step 2 instructions"],
      "tips": "Optional cooking tips"
    }
  ]
}

Focus on recipes that use most of the available ingredients and are practical to make with the listed tools.`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ingredients.trim()) return

    setIsLoading(true)
    setError('')
    setCurrentView('loading')

    try {
      const prompt = generateRecipePrompt(ingredients, availableTools)
      const response = await callOpenAI(prompt)
      
      // Parse the JSON response
      let parsedRecipes
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedRecipes = JSON.parse(jsonMatch[0])
        } else {
          // Fallback: assume the entire response is JSON
          parsedRecipes = JSON.parse(response)
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        throw new Error('Invalid response format from OpenAI')
      }

      if (parsedRecipes && parsedRecipes.recipes && Array.isArray(parsedRecipes.recipes)) {
        setRecipes(parsedRecipes.recipes)
        setCurrentView('recipes')
      } else {
        throw new Error('No recipes found in the response')
      }
    } catch (error) {
      console.error('Recipe generation error:', error)
      setError(error.message)
      setCurrentView('input')
    } finally {
      setIsLoading(false)
    }
  }

  const selectRecipe = (recipe) => {
    setSelectedRecipe(recipe)
    setCurrentStep(0)
    setCurrentView('walkthrough')
  }

  const nextStep = () => {
    if (currentStep < selectedRecipe.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goBack = () => {
    if (currentView === 'recipes') {
      setCurrentView('input')
      setRecipes([])
    } else if (currentView === 'walkthrough') {
      setCurrentView('recipes')
      setSelectedRecipe(null)
      setCurrentStep(0)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'hard': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDifficultyEmoji = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '🟢'
      case 'medium': return '🟡'
      case 'hard': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className="min-h-screen app-container">
      <div className="animated-background"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="hero-section">
          <h1 className="hero-title">
            AI CULINARY CHEF
          </h1>
          <h2 className="hero-subtitle">
            Powered by OpenAI
          </h2>
          <p className="hero-description">
            Transform your kitchen ingredients into amazing meals with AI-powered recipe generation. 
            Get personalized recipes based on your available ingredients and kitchen tools.
          </p>
          
          {/* API Configuration Toggle */}
          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="api-config-toggle"
          >
            ⚙️ API Configuration
          </button>
        </div>

        {/* API Configuration Panel */}
        {showApiConfig && (
          <div className="api-config-panel">
            <h3 className="api-config-title">OpenAI API Configuration</h3>
            <div className="api-config-fields">
              <div>
                <label className="api-config-label">
                  API Endpoint
                </label>
                <input
                  type="text"
                  value={apiConfig.endpoint}
                  onChange={(e) => setApiConfig({...apiConfig, endpoint: e.target.value})}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="api-config-input"
                />
              </div>
              <div>
                <label className="api-config-label">
                  API Key (optional)
                </label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                  placeholder="Your OpenAI API key"
                  className="api-config-input"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Input Form */}
        {currentView === 'input' && (
          <div className="max-w-2xl mx-auto mt-16">
            <div className="premium-card">
              <div className="card-content">
                <h3 className="card-title">
                  What's Available in Your Kitchen?
                </h3>
                
                {error && (
                  <div className="error-message">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                
                <div className="space-y-8">
                  <div className="input-container">
                    <label className="input-label">
                      Available Ingredients *
                    </label>
                    <textarea
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="Enter your ingredients separated by commas (e.g., chicken breast, broccoli, rice, garlic, olive oil, cheese)"
                      className="premium-textarea"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="input-container">
                    <label className="input-label">
                      Available Kitchen Tools (optional)
                    </label>
                    <textarea
                      value={availableTools}
                      onChange={(e) => setAvailableTools(e.target.value)}
                      placeholder="Enter your kitchen tools (e.g., oven, stovetop, air fryer, blender, food processor, grill)"
                      className="premium-textarea"
                      rows={3}
                    />
                    <p className="input-helper-text">
                      Leave empty to assume basic kitchen tools (stove, oven, basic cookware)
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={!ingredients.trim() || isLoading}
                    className="premium-button"
                  >
                    {isLoading ? '🤖 AI Chef is Thinking...' : '🚀 Generate AI Recipes'}
                  </button>
                </div>
                
                <p className="signup-offer">
                  ✨ Powered by artificial intelligence for personalized recipe creation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {currentView === 'loading' && (
          <div className="max-w-2xl mx-auto">
            <div className="loading-container">
              <div className="loading-icon">🤖</div>
              <h3 className="loading-title">AI Chef is Working...</h3>
              <p className="loading-description">
                Analyzing your ingredients and generating personalized recipes
              </p>
              <div className="loading-dots">
                <div className="loading-dot loading-dot-1"></div>
                <div className="loading-dot loading-dot-2"></div>
                <div className="loading-dot loading-dot-3"></div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Results */}
        {currentView === 'recipes' && (
          <div className="max-w-7xl mx-auto mt-12">
            <button
              onClick={goBack}
              className="back-button mb-12"
            >
              ← Try Different Ingredients
            </button>
            
            <h2 className="section-title">
              🍳 AI-Generated Recipes for You
            </h2>
            
            {recipes.length === 0 ? (
              <div className="no-results">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-slate-500">
                  No recipes found. Try adding more ingredients!
                </p>
              </div>
            ) : (
              <div className="recipe-grid">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="recipe-card enhanced-recipe-card"
                    onClick={() => selectRecipe(recipe)}
                  >
                    <div className="recipe-icon">👨‍🍳</div>
                    <h3 className="recipe-name">
                      {recipe.name}
                    </h3>
                    
                    <p className="recipe-description">
                      {recipe.description}
                    </p>
                    
                    <div className="recipe-details">
                      <div className="recipe-detail-item">
                        <span className="recipe-detail-label">⏱️ Cooking Time:</span>
                        <span className="recipe-detail-value">{recipe.cookingTime}</span>
                      </div>
                      
                      <div className="recipe-detail-item">
                        <span className="recipe-detail-label">📊 Difficulty:</span>
                        <span className={`recipe-detail-value ${getDifficultyColor(recipe.difficulty)}`}>
                          {getDifficultyEmoji(recipe.difficulty)} {recipe.difficulty}
                        </span>
                      </div>
                      
                      <div className="recipe-detail-item">
                        <span className="recipe-detail-label">📝 Steps:</span>
                        <span className="recipe-detail-value">{recipe.steps?.length || 0}</span>
                      </div>
                    </div>
                    
                    {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                      <div className="missing-ingredients">
                        <p className="missing-ingredients-text">
                          ⚠️ Missing: {recipe.missingIngredients.join(', ')}
                        </p>
                      </div>
                    )}
                    
                    <div className="recipe-overlay">
                      <span className="start-cooking">Start Cooking →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe Walkthrough */}
        {currentView === 'walkthrough' && selectedRecipe && (
          <div className="max-w-5xl mx-auto mt-12">
            <button
              onClick={goBack}
              className="back-button mb-12"
            >
              ← Back to Recipes
            </button>
            
            <div className="walkthrough-container">
              <div className="walkthrough-header">
                <h2 className="walkthrough-title">{selectedRecipe.name}</h2>
                <p className="walkthrough-progress">Step {currentStep + 1} of {selectedRecipe.steps.length}</p>
                <div className="walkthrough-meta">
                  <span>⏱️ {selectedRecipe.cookingTime}</span>
                  <span>{getDifficultyEmoji(selectedRecipe.difficulty)} {selectedRecipe.difficulty}</span>
                </div>
              </div>
              
              <div className="walkthrough-content">
                <div className="chef-icon">👨‍🍳</div>
                <p className="current-step">
                  {selectedRecipe.steps[currentStep]}
                </p>
                
                {selectedRecipe.tips && currentStep === selectedRecipe.steps.length - 1 && (
                  <div className="chef-tips">
                    <h4 className="chef-tips-title">💡 Chef's Tips:</h4>
                    <p className="chef-tips-content">{selectedRecipe.tips}</p>
                  </div>
                )}
              </div>
              
              <div className="walkthrough-controls">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="control-button"
                >
                  ← Previous
                </button>
                
                <div className="step-indicators">
                  {selectedRecipe.steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`step-dot ${index === currentStep ? 'active' : ''}`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextStep}
                  disabled={currentStep === selectedRecipe.steps.length - 1}
                  className="control-button"
                >
                  {currentStep === selectedRecipe.steps.length - 1 ? '✓ Complete' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App