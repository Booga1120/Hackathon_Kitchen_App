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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-orange-800 mb-8">
          🍳 Cook-Along
        </h1>
        
        {currentView === 'input' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-200">
              <h2 className="text-3xl font-bold text-center text-orange-800 mb-6">
                What's in your kitchen?
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="Enter your ingredients separated by commas (e.g., eggs, milk, cheese, tomatoes)"
                  className="w-full p-4 border-4 border-orange-300 rounded-xl text-lg resize-none focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
                  rows={6}
                />
                <button
                  type="submit"
                  disabled={!ingredients.trim()}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xl font-bold rounded-xl hover:from-orange-700 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  Find Recipes
                </button>
              </form>
            </div>
          </div>
        )}

        {currentView === 'recipes' && (
          <div className="max-w-6xl mx-auto">
            <button
              onClick={goBack}
              className="mb-8 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all duration-300"
            >
              ← Start Over
            </button>
            
            <h2 className="text-3xl font-bold text-center text-orange-800 mb-8">
              Recipes you can make:
            </h2>
            
            {recipes.length === 0 ? (
              <div className="text-center text-xl text-orange-600">
                No recipes found. Try adding more ingredients!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-2xl shadow-xl p-6 border-4 border-transparent hover:border-orange-500 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-2"
                    onClick={() => selectRecipe(recipe)}
                  >
                    <div className="text-6xl text-center mb-4">🍳</div>
                    <h3 className="text-2xl font-bold text-orange-800 text-center mb-2">
                      {recipe.name}
                    </h3>
                    <p className="text-orange-600 text-center font-semibold">
                      {recipe.steps.length} steps
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'walkthrough' && selectedRecipe && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={goBack}
              className="mb-8 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all duration-300"
            >
              ← Back to Recipes
            </button>
            
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-orange-200">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 text-center">
                <h2 className="text-3xl font-bold mb-2">{selectedRecipe.name}</h2>
                <p className="text-xl">Step {currentStep + 1} of {selectedRecipe.steps.length}</p>
              </div>
              
              <div className="p-8 text-center">
                <div className="text-8xl mb-6">👨‍🍳</div>
                <p className="text-2xl font-bold text-orange-800 leading-relaxed">
                  {selectedRecipe.steps[currentStep]}
                </p>
              </div>
              
              <div className="bg-orange-50 p-6 flex items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                >
                  ← Previous
                </button>
                
                <div className="flex gap-2">
                  {selectedRecipe.steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 scale-125'
                          : 'bg-gray-300 hover:bg-orange-400'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextStep}
                  disabled={currentStep === selectedRecipe.steps.length - 1}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {currentStep === selectedRecipe.steps.length - 1 ? 'Finish' : 'Next →'}
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
