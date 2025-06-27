import { useState } from 'react'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('input') // 'input', 'recipes', 'walkthrough', 'loading', 'finished'
  const [ingredients, setIngredients] = useState('')
  const [availableTools, setAvailableTools] = useState('')
  const [recipes, setRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [conversionFromValue, setConversionFromValue] = useState('')
  const [conversionFromUnit, setConversionFromUnit] = useState('')
  const [conversionToValue, setConversionToValue] = useState('')
  const [conversionToUnit, setConversionToUnit] = useState('')
  const [userRating, setUserRating] = useState(null)
  const [showTools, setShowTools] = useState(false)
  const [desiredStyle, setDesiredStyle] = useState('')

  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const callOpenAI = async (prompt) => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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

  const generateRecipePrompt = (ingredientsList, toolsList, style) => {
    return `You are a professional chef assistant. I have the following ingredients and kitchen tools available:

INGREDIENTS:
${ingredientsList}

AVAILABLE KITCHEN TOOLS:
${toolsList || 'Basic kitchen tools (knife, cutting board, stove, oven, basic cookware)'}

${style ? `DESIRED STYLE OF FOOD: ${style}\n` : ''}

Please suggest 5 practical recipes I can make with these ingredients and tools. We do not need to use all of them! For each recipe, provide:

1. Recipe name
2. Brief description (1-2 sentences)
3. Estimated cooking time
4. Difficulty level (Easy/Medium/Hard)
5. Complete list of ingredients needed, with accurate measurements or amounts for each ingredient (e.g., 200g chicken, 1 tablespoon olive oil, 2 cups rice, etc.)
6. Clearly list any missing ingredients that are required for the recipe but not present in my provided list (as a separate array called missingIngredients)
7. Step-by-step cooking instructions (numbered, and should be practical and easy to follow, each step description should be concise)
8. Any tips for variations and safety

**Additionally, suggest 1 more recipe that is local or traditional to Indiana, USA.**
- This Indiana recipe should follow the same format as above, and can use my available ingredients if possible, but does not have to.
- **Clearly label this recipe as 'Indiana Recipe' in the name (e.g., 'Indiana Recipe: Pork Tenderloin Sandwich') or add a field 'isIndianaRecipe': true in the JSON.**

**IMPORTANT:**
- Prioritize recipes that use the most available ingredients and minimize missing ingredients. Only include recipes where most of the ingredients are present.
- Make the instructions as simple and broken down as possible, suitable for beginners or elderly users.
- Break down each step into the smallest possible action (e.g., instead of "Chop and sauté onions," use "Chop the onions" and then "Sauté the onions in a pan").
- It is OK if this increases the total number of steps.
- **Provide accurate and precise measurements for all ingredients and steps (e.g., use grams, milliliters, or exact quantities instead of vague terms like 'some' or 'a handful').**
- **Always return a missingIngredients array for each recipe, listing any ingredients not present in my list but required for the recipe.**

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
      "tips": "Optional cooking tips",
      "isIndianaRecipe": true // Only for the Indiana recipe
    }
  ]
}

Focus on recipes that use most of the available ingredients and are practical to make with the listed tools.`
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setCurrentView('loading');
    setShowTools(false);

    let usedIngredients = ingredients;

    try {
      const prompt = generateRecipePrompt(usedIngredients, availableTools, desiredStyle);
      const response = await callOpenAI(prompt);
      
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
    } else {
      setCurrentView('finished')
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

  const performConversion = () => {
    if (!conversionFromValue || !conversionFromUnit || !conversionToUnit) {
      return;
    }

    const fromValue = parseFloat(conversionFromValue);
    let result = 0;

    // Volume conversions (all to ml first, then to target)
    const volumeToMl = {
      cup: 240,
      tbsp: 15,
      tsp: 5,
      ml: 1,
      floz: 29.5735,
      pint: 473.176,
      quart: 946.353,
      gallon: 3785.41
    };

    // Weight conversions (all to grams first, then to target)
    const weightToG = {
      oz: 28.3495,
      lb: 453.592,
      g: 1,
      kg: 1000
    };

    // Temperature conversions
    if (conversionFromUnit === 'f' && conversionToUnit === 'c') {
      result = (fromValue - 32) * 5/9;
    } else if (conversionFromUnit === 'c' && conversionToUnit === 'f') {
      result = (fromValue * 9/5) + 32;
    }
    // Volume conversions
    else if (volumeToMl[conversionFromUnit] && volumeToMl[conversionToUnit]) {
      const mlValue = fromValue * volumeToMl[conversionFromUnit];
      result = mlValue / volumeToMl[conversionToUnit];
    }
    // Weight conversions
    else if (weightToG[conversionFromUnit] && weightToG[conversionToUnit]) {
      const gValue = fromValue * weightToG[conversionFromUnit];
      result = gValue / weightToG[conversionToUnit];
    }

    setConversionToValue(result.toFixed(2));
  };

  const handleRateExperience = (rating) => {
    setUserRating(rating);
    // Optionally, send feedback to server or show a thank you message
  };

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
        </div>
        
        {/* Main Content with Tables */}
        <div className="flex gap-8 mt-8">
          {/* Show tools only on input page */}
          {currentView === 'input' && (
            <div className="flex-1 even-height-panel">
              <div className="conversion-table-container">
                <h3 className="conversion-table-title">
                  📏 Measurement Converter
                </h3>
                <p className="conversion-table-subtitle">
                  Convert between cooking units
                </p>
                
                <div className="conversion-tool">
                  <div className="conversion-input-group">
                    <label className="conversion-label">From:</label>
                    <div className="conversion-row">
                      <input
                        type="number"
                        className="conversion-input"
                        placeholder="0"
                        value={conversionFromValue}
                        onChange={(e) => setConversionFromValue(e.target.value)}
                      />
                      <select
                        className="conversion-select"
                        value={conversionFromUnit}
                        onChange={(e) => setConversionFromUnit(e.target.value)}
                      >
                        <option value="">Select unit</option>
                        <optgroup label="Volume">
                          <option value="cup">Cup</option>
                          <option value="tbsp">Tablespoon</option>
                          <option value="tsp">Teaspoon</option>
                          <option value="ml">Milliliter (ml)</option>
                          <option value="floz">Fluid Ounce</option>
                          <option value="pint">Pint</option>
                          <option value="quart">Quart</option>
                          <option value="gallon">Gallon</option>
                        </optgroup>
                        <optgroup label="Weight">
                          <option value="oz">Ounce (oz)</option>
                          <option value="lb">Pound (lb)</option>
                          <option value="g">Gram (g)</option>
                          <option value="kg">Kilogram (kg)</option>
                        </optgroup>
                        <optgroup label="Temperature">
                          <option value="f">Fahrenheit (°F)</option>
                          <option value="c">Celsius (°C)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="conversion-arrow">↓</div>

                  <div className="conversion-input-group">
                    <label className="conversion-label">To:</label>
                    <div className="conversion-row">
                      <input
                        type="number"
                        className="conversion-input"
                        placeholder="0"
                        value={conversionToValue}
                        readOnly
                      />
                      <select
                        className="conversion-select"
                        value={conversionToUnit}
                        onChange={(e) => setConversionToUnit(e.target.value)}
                      >
                        <option value="">Select unit</option>
                        <optgroup label="Volume">
                          <option value="cup">Cup</option>
                          <option value="tbsp">Tablespoon</option>
                          <option value="tsp">Teaspoon</option>
                          <option value="ml">Milliliter (ml)</option>
                          <option value="floz">Fluid Ounce</option>
                          <option value="pint">Pint</option>
                          <option value="quart">Quart</option>
                          <option value="gallon">Gallon</option>
                        </optgroup>
                        <optgroup label="Weight">
                          <option value="oz">Ounce (oz)</option>
                          <option value="lb">Pound (lb)</option>
                          <option value="g">Gram (g)</option>
                          <option value="kg">Kilogram (kg)</option>
                        </optgroup>
                        <optgroup label="Temperature">
                          <option value="f">Fahrenheit (°F)</option>
                          <option value="c">Celsius (°C)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <button
                    className="conversion-button"
                    onClick={performConversion}
                    disabled={!conversionFromValue || !conversionFromUnit || !conversionToUnit}
                  >
                    Convert
                  </button>
                </div>
                
                <div className="conversion-tips">
                  <h4 className="conversion-tips-title">💡 Quick Tips:</h4>
                  <ul className="conversion-tips-list">
                    <li>1 cup = 16 tablespoons</li>
                    <li>1 tablespoon = 3 teaspoons</li>
                    <li>1 stick butter = 1/2 cup</li>
                    <li>1 large egg = ~50g</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* Center - Main Content */}
          <div className="flex-1 even-height-panel">
            {/* Input Form */}
        {currentView === 'input' && (
          <div className="max-w-2xl mx-auto">
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
                      
                      <div className="input-container">
                        <label className="input-label">
                          Desired Style of Food (optional)
                        </label>
                        <input
                          type="text"
                          value={desiredStyle}
                          onChange={(e) => setDesiredStyle(e.target.value)}
                          placeholder="e.g., Mexican, Thai, Italian, Comfort Food, etc."
                          className="premium-textarea"
                        />
                        <p className="input-helper-text">
                          Suggest a cuisine or style to personalize your recipes
                        </p>
                      </div>
                      
                <button
                        onClick={handleSubmit}
                        disabled={(!ingredients.trim()) || isLoading}
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
              <>
                <button
                  className="premium-button mb-8"
                  onClick={() => setShowTools((prev) => !prev)}
                >
                  {showTools ? 'Hide Tools' : 'Show Tools'}
                </button>
                <div className="max-w-7xl mx-auto">
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
                {/* Show tools below the recipe list if toggled on */}
                {showTools && (
                  <div className="flex gap-8 mt-8">
                    <div className="flex-1 even-height-panel">
                      <div className="conversion-table-container">
                        <h3 className="conversion-table-title">
                          📏 Measurement Converter
                        </h3>
                        <p className="conversion-table-subtitle">
                          Convert between cooking units
                        </p>
                        
                        <div className="conversion-tool">
                          <div className="conversion-input-group">
                            <label className="conversion-label">From:</label>
                            <div className="conversion-row">
                              <input
                                type="number"
                                className="conversion-input"
                                placeholder="0"
                                value={conversionFromValue}
                                onChange={(e) => setConversionFromValue(e.target.value)}
                              />
                              <select
                                className="conversion-select"
                                value={conversionFromUnit}
                                onChange={(e) => setConversionFromUnit(e.target.value)}
                              >
                                <option value="">Select unit</option>
                                <optgroup label="Volume">
                                  <option value="cup">Cup</option>
                                  <option value="tbsp">Tablespoon</option>
                                  <option value="tsp">Teaspoon</option>
                                  <option value="ml">Milliliter (ml)</option>
                                  <option value="floz">Fluid Ounce</option>
                                  <option value="pint">Pint</option>
                                  <option value="quart">Quart</option>
                                  <option value="gallon">Gallon</option>
                                </optgroup>
                                <optgroup label="Weight">
                                  <option value="oz">Ounce (oz)</option>
                                  <option value="lb">Pound (lb)</option>
                                  <option value="g">Gram (g)</option>
                                  <option value="kg">Kilogram (kg)</option>
                                </optgroup>
                                <optgroup label="Temperature">
                                  <option value="f">Fahrenheit (°F)</option>
                                  <option value="c">Celsius (°C)</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          <div className="conversion-arrow">↓</div>

                          <div className="conversion-input-group">
                            <label className="conversion-label">To:</label>
                            <div className="conversion-row">
                              <input
                                type="number"
                                className="conversion-input"
                                placeholder="0"
                                value={conversionToValue}
                                readOnly
                              />
                              <select
                                className="conversion-select"
                                value={conversionToUnit}
                                onChange={(e) => setConversionToUnit(e.target.value)}
                              >
                                <option value="">Select unit</option>
                                <optgroup label="Volume">
                                  <option value="cup">Cup</option>
                                  <option value="tbsp">Tablespoon</option>
                                  <option value="tsp">Teaspoon</option>
                                  <option value="ml">Milliliter (ml)</option>
                                  <option value="floz">Fluid Ounce</option>
                                  <option value="pint">Pint</option>
                                  <option value="quart">Quart</option>
                                  <option value="gallon">Gallon</option>
                                </optgroup>
                                <optgroup label="Weight">
                                  <option value="oz">Ounce (oz)</option>
                                  <option value="lb">Pound (lb)</option>
                                  <option value="g">Gram (g)</option>
                                  <option value="kg">Kilogram (kg)</option>
                                </optgroup>
                                <optgroup label="Temperature">
                                  <option value="f">Fahrenheit (°F)</option>
                                  <option value="c">Celsius (°C)</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          <button
                            className="conversion-button"
                            onClick={performConversion}
                            disabled={!conversionFromValue || !conversionFromUnit || !conversionToUnit}
                          >
                            Convert
                          </button>
                        </div>
                        
                        <div className="conversion-tips">
                          <h4 className="conversion-tips-title">💡 Quick Tips:</h4>
                          <ul className="conversion-tips-list">
                            <li>1 cup = 16 tablespoons</li>
                            <li>1 tablespoon = 3 teaspoons</li>
                            <li>1 stick butter = 1/2 cup</li>
                            <li>1 large egg = ~50g</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 even-height-panel">
                      <div className="safety-table-container">
                        <h3 className="safety-table-title">
                          🌡️ Safe Cooking Temperatures
                        </h3>
                        <p className="safety-table-subtitle">
                          Internal temperatures for food safety
                        </p>
                        
                        <div className="safety-table">
                          <div className="safety-table-header">
                            <div className="safety-table-cell header">Food Type</div>
                            <div className="safety-table-cell header">Temperature</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Ground Beef/Pork</div>
                            <div className="safety-table-cell temp">160°F (71°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Beef Steaks/Roasts</div>
                            <div className="safety-table-cell temp">145°F (63°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Pork Chops/Roasts</div>
                            <div className="safety-table-cell temp">145°F (63°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Chicken/Turkey</div>
                            <div className="safety-table-cell temp">165°F (74°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Duck/Goose</div>
                            <div className="safety-table-cell temp">165°F (74°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Fish/Seafood</div>
                            <div className="safety-table-cell temp">145°F (63°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Eggs</div>
                            <div className="safety-table-cell temp">160°F (71°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Leftovers</div>
                            <div className="safety-table-cell temp">165°F (74°C)</div>
                          </div>
                        </div>
                        
                        <div className="safety-tips">
                          <h4 className="safety-tips-title">💡 Safety Tips:</h4>
                          <ul className="safety-tips-list">
                            <li>Use a food thermometer for accuracy</li>
                            <li>Check the thickest part of the meat</li>
                            <li>Let meat rest 3-5 minutes after cooking</li>
                            <li>When in doubt, cook it longer</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Recipe Walkthrough */}
        {currentView === 'walkthrough' && selectedRecipe && (
              <>
                <button
                  className="premium-button mb-8"
                  onClick={() => setShowTools((prev) => !prev)}
                >
                  {showTools ? 'Hide Tools' : 'Show Tools'}
                </button>
                <div className="max-w-5xl mx-auto">
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
                        onClick={currentStep === selectedRecipe.steps.length - 1 ? () => setCurrentView('finished') : nextStep}
                        disabled={currentStep === selectedRecipe.steps.length - 1 && currentView === 'finished'}
                        className="control-button"
                      >
                        {currentStep === selectedRecipe.steps.length - 1 ? '✓ Complete' : 'Next →'}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Show tools below the walkthrough if toggled on */}
                {showTools && (
                  <div className="flex gap-8 mt-8">
                    <div className="flex-1 even-height-panel">
                      <div className="conversion-table-container">
                        <h3 className="conversion-table-title">
                          📏 Measurement Converter
                        </h3>
                        <p className="conversion-table-subtitle">
                          Convert between cooking units
                        </p>
                        
                        <div className="conversion-tool">
                          <div className="conversion-input-group">
                            <label className="conversion-label">From:</label>
                            <div className="conversion-row">
                              <input
                                type="number"
                                className="conversion-input"
                                placeholder="0"
                                value={conversionFromValue}
                                onChange={(e) => setConversionFromValue(e.target.value)}
                              />
                              <select
                                className="conversion-select"
                                value={conversionFromUnit}
                                onChange={(e) => setConversionFromUnit(e.target.value)}
                              >
                                <option value="">Select unit</option>
                                <optgroup label="Volume">
                                  <option value="cup">Cup</option>
                                  <option value="tbsp">Tablespoon</option>
                                  <option value="tsp">Teaspoon</option>
                                  <option value="ml">Milliliter (ml)</option>
                                  <option value="floz">Fluid Ounce</option>
                                  <option value="pint">Pint</option>
                                  <option value="quart">Quart</option>
                                  <option value="gallon">Gallon</option>
                                </optgroup>
                                <optgroup label="Weight">
                                  <option value="oz">Ounce (oz)</option>
                                  <option value="lb">Pound (lb)</option>
                                  <option value="g">Gram (g)</option>
                                  <option value="kg">Kilogram (kg)</option>
                                </optgroup>
                                <optgroup label="Temperature">
                                  <option value="f">Fahrenheit (°F)</option>
                                  <option value="c">Celsius (°C)</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          <div className="conversion-arrow">↓</div>

                          <div className="conversion-input-group">
                            <label className="conversion-label">To:</label>
                            <div className="conversion-row">
                              <input
                                type="number"
                                className="conversion-input"
                                placeholder="0"
                                value={conversionToValue}
                                readOnly
                              />
                              <select
                                className="conversion-select"
                                value={conversionToUnit}
                                onChange={(e) => setConversionToUnit(e.target.value)}
                              >
                                <option value="">Select unit</option>
                                <optgroup label="Volume">
                                  <option value="cup">Cup</option>
                                  <option value="tbsp">Tablespoon</option>
                                  <option value="tsp">Teaspoon</option>
                                  <option value="ml">Milliliter (ml)</option>
                                  <option value="floz">Fluid Ounce</option>
                                  <option value="pint">Pint</option>
                                  <option value="quart">Quart</option>
                                  <option value="gallon">Gallon</option>
                                </optgroup>
                                <optgroup label="Weight">
                                  <option value="oz">Ounce (oz)</option>
                                  <option value="lb">Pound (lb)</option>
                                  <option value="g">Gram (g)</option>
                                  <option value="kg">Kilogram (kg)</option>
                                </optgroup>
                                <optgroup label="Temperature">
                                  <option value="f">Fahrenheit (°F)</option>
                                  <option value="c">Celsius (°C)</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          <button
                            className="conversion-button"
                            onClick={performConversion}
                            disabled={!conversionFromValue || !conversionFromUnit || !conversionToUnit}
                          >
                            Convert
                </button>
                        </div>
                        
                        <div className="conversion-tips">
                          <h4 className="conversion-tips-title">💡 Quick Tips:</h4>
                          <ul className="conversion-tips-list">
                            <li>1 cup = 16 tablespoons</li>
                            <li>1 tablespoon = 3 teaspoons</li>
                            <li>1 stick butter = 1/2 cup</li>
                            <li>1 large egg = ~50g</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 even-height-panel">
                      <div className="safety-table-container">
                        <h3 className="safety-table-title">
                          🌡️ Safe Cooking Temperatures
                        </h3>
                        <p className="safety-table-subtitle">
                          Internal temperatures for food safety
                        </p>
                        
                        <div className="safety-table">
                          <div className="safety-table-header">
                            <div className="safety-table-cell header">Food Type</div>
                            <div className="safety-table-cell header">Temperature</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Ground Beef/Pork</div>
                            <div className="safety-table-cell temp">160°F (71°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Beef Steaks/Roasts</div>
                            <div className="safety-table-cell temp">145°F (63°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Pork Chops/Roasts</div>
                            <div className="safety-table-cell temp">145°F (63°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Chicken/Turkey</div>
                            <div className="safety-table-cell temp">165°F (74°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Duck/Goose</div>
                            <div className="safety-table-cell temp">165°F (74°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Fish/Seafood</div>
                            <div className="safety-table-cell temp">145°F (63°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Eggs</div>
                            <div className="safety-table-cell temp">160°F (71°C)</div>
                          </div>
                          
                          <div className="safety-table-row">
                            <div className="safety-table-cell">Leftovers</div>
                            <div className="safety-table-cell temp">165°F (74°C)</div>
                          </div>
                        </div>
                        
                        <div className="safety-tips">
                          <h4 className="safety-tips-title">💡 Safety Tips:</h4>
                          <ul className="safety-tips-list">
                            <li>Use a food thermometer for accuracy</li>
                            <li>Check the thickest part of the meat</li>
                            <li>Let meat rest 3-5 minutes after cooking</li>
                            <li>When in doubt, cook it longer</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Finishing Screen */}
            {currentView === 'finished' && (
              <FinishingScreen
                recipeName={selectedRecipe?.name}
                onRate={handleRateExperience}
                onHome={() => {
                  setCurrentView('input');
                  setIngredients('');
                  setAvailableTools('');
                  setRecipes([]);
                  setSelectedRecipe(null);
                  setCurrentStep(0);
                  setDesiredStyle('');
                  setError('');
                }}
              />
            )}
          </div>
          {/* Show safety chart only on input page */}
          {currentView === 'input' && (
            <div className="flex-1 even-height-panel">
              <div className="safety-table-container">
                <h3 className="safety-table-title">
                  🌡️ Safe Cooking Temperatures
                </h3>
                <p className="safety-table-subtitle">
                  Internal temperatures for food safety
                </p>
                
                <div className="safety-table">
                  <div className="safety-table-header">
                    <div className="safety-table-cell header">Food Type</div>
                    <div className="safety-table-cell header">Temperature</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Ground Beef/Pork</div>
                    <div className="safety-table-cell temp">160°F (71°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Beef Steaks/Roasts</div>
                    <div className="safety-table-cell temp">145°F (63°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Pork Chops/Roasts</div>
                    <div className="safety-table-cell temp">145°F (63°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Chicken/Turkey</div>
                    <div className="safety-table-cell temp">165°F (74°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Duck/Goose</div>
                    <div className="safety-table-cell temp">165°F (74°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Fish/Seafood</div>
                    <div className="safety-table-cell temp">145°F (63°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Eggs</div>
                    <div className="safety-table-cell temp">160°F (71°C)</div>
                  </div>
                  
                  <div className="safety-table-row">
                    <div className="safety-table-cell">Leftovers</div>
                    <div className="safety-table-cell temp">165°F (74°C)</div>
                  </div>
                </div>
                
                <div className="safety-tips">
                  <h4 className="safety-tips-title">💡 Safety Tips:</h4>
                  <ul className="safety-tips-list">
                    <li>Use a food thermometer for accuracy</li>
                    <li>Check the thickest part of the meat</li>
                    <li>Let meat rest 3-5 minutes after cooking</li>
                    <li>When in doubt, cook it longer</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          </div>
      </div>
    </div>
  )
}

function FinishingScreen({ recipeName, onRate, onHome }) {
  const [selected, setSelected] = useState(null);
  const handleClick = (rating) => {
    setSelected(rating);
    if (onRate) onRate(rating);
  };
  return (
    <div>
      <div className="finishing-screen flex gap-8 mt-8">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col items-center justify-center premium-card">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="mb-2 text-green-700">Congrats!</h2>
          <p className="mb-2 text-slate-700">You've made the meal!</p>
          {recipeName && <div className="text-2xl font-semibold text-indigo-700 mb-2">{recipeName}</div>}
        </div>
        {/* Right Panel */}
        <div className="flex-1 flex flex-col items-center justify-center premium-card">
          <h3 className="mb-4 text-pink-700">How was your experience?</h3>
          <div className="flex gap-6 mb-4">
            <button className={`rating-btn${selected === 'happy' ? ' selected' : ''}`} onClick={() => handleClick('happy')} aria-label="Happy">
              😃
            </button>
            <button className={`rating-btn${selected === 'neutral' ? ' selected' : ''}`} onClick={() => handleClick('neutral')} aria-label="Neutral">
              😐
            </button>
            <button className={`rating-btn${selected === 'sad' ? ' selected' : ''}`} onClick={() => handleClick('sad')} aria-label="Sad">
              😞
            </button>
          </div>
          <p className="text-slate-500 text-lg mb-6">Tap an emoji to rate your cook-along!</p>
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button
          className="premium-button"
          onClick={onHome}
        >
          Home
        </button>
      </div>
    </div>
  );
}

export default App