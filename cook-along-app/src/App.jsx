import { useState } from 'react'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('input') // 'input', 'recipes', 'walkthrough'
  const [ingredients, setIngredients] = useState('')
  const [recipes, setRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)

  // Mock recipe data
  const mockRecipes = [
    {
      id: 1,
      name: 'Scrambled Eggs with Toast',
      ingredients: ['eggs', 'bread', 'butter', 'salt', 'pepper'],
      steps: [
        'Crack 2-3 eggs into a bowl and whisk them',
        'Add a pinch of salt and pepper to the eggs',
        'Heat a pan over medium heat and add butter',
        'Pour the eggs into the pan and stir gently',
        'Toast bread until golden brown',
        'Serve eggs on top of toast'
      ]
    },
    {
      id: 2,
      name: 'Simple Pasta',
      ingredients: ['pasta', 'olive oil', 'garlic', 'salt', 'parmesan'],
      steps: [
        'Bring a large pot of water to boil',
        'Add salt to the water',
        'Cook pasta according to package instructions',
        'While pasta cooks, mince garlic',
        'Heat olive oil in a pan and sauté garlic',
        'Drain pasta and mix with garlic oil',
        'Top with grated parmesan cheese'
      ]
    }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!ingredients.trim()) return
    
    const ingredientList = ingredients.toLowerCase().split(',').map(item => item.trim())
    const matchingRecipes = mockRecipes.filter(recipe => 
      recipe.ingredients.some(ingredient => 
        ingredientList.some(inputIngredient => 
          inputIngredient.includes(ingredient) || ingredient.includes(inputIngredient)
        )
      )
    )
    
    setRecipes(matchingRecipes)
    setCurrentView('recipes')
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

  return (
    <div className="min-h-screen app-container">
      <div className="animated-background"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="hero-section">
          <h1 className="hero-title">
            CULINARY RECIPE ENGINE
          </h1>
          <h2 className="hero-subtitle">
            Cook Amazing Meals From Ingredients
          </h2>
          <p className="hero-description">
            Transform your kitchen ingredients into stunning homemade meals. Perfect for busy weeknights, 
            weekend cooking adventures, and more, our tool matches your ingredients with custom recipes, 
            step-by-step instructions, and cooking guidance in just minutes.
          </p>
        </div>
        
        {currentView === 'input' && (
          <div className="max-w-2xl mx-auto mt-16">
            <div className="premium-card">
              <div className="card-content">
                <h3 className="card-title">
                  What's in your kitchen?
                </h3>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="input-container">
                    <textarea
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="Enter your ingredients separated by commas (e.g., eggs, milk, cheese, tomatoes)"
                      className="premium-textarea"
                      rows={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!ingredients.trim()}
                    className="premium-button"
                  >
                    Find Perfect Recipes
                  </button>
                </form>
                <p className="signup-offer">
                  Create your first meal! No cooking experience required
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'recipes' && (
          <div className="max-w-7xl mx-auto mt-12">
            <button
              onClick={goBack}
              className="back-button mb-12"
            >
              ← Start Over
            </button>
            
            <h2 className="section-title">
              Recipes you can make:
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
                    className="recipe-card"
                    onClick={() => selectRecipe(recipe)}
                  >
                    <div className="recipe-icon">🍳</div>
                    <h3 className="recipe-name">
                      {recipe.name}
                    </h3>
                    <p className="recipe-steps">
                      {recipe.steps.length} guided steps
                    </p>
                    <div className="recipe-overlay">
                      <span className="start-cooking">Start Cooking →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
              </div>
              
              <div className="walkthrough-content">
                <div className="chef-icon">👨‍🍳</div>
                <p className="current-step">
                  {selectedRecipe.steps[currentStep]}
                </p>
              </div>
              
              <div className="walkthrough-controls">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="control-button prev-button"
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
                  className="control-button next-button"
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