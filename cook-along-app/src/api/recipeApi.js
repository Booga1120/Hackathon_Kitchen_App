import { getApiConfig } from '../config/apiConfig';

// Get API configuration
const config = getApiConfig();

// Helper function to make API calls to OpenAI
async function makeOpenAIApiCall(prompt) {
  try {
    console.log('Making OpenAI API call to:', config.OPENAI_API_URL);
    
    const response = await fetch(config.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.API_KEY}`,
      },
      body: JSON.stringify({
        model: config.MODEL,
        messages: [
          {
            role: 'system',
            content: config.SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.TEMPERATURE,
        max_tokens: config.MAX_TOKENS
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', errorText);
      throw new Error(`OpenAI API call failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API Response data:', data);
    
    // Extract the content from the response
    return data.choices?.[0]?.message?.content || '';
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    // Return mock data for demo purposes
    return getFallbackRecipes();
  }
}

// Fallback recipes in case API fails
function getFallbackRecipes() {
  const fallbackRecipes = [
    {
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
    },
    {
      name: 'Grilled Cheese Sandwich',
      ingredients: ['bread', 'cheese', 'butter'],
      steps: [
        'Butter one side of each bread slice',
        'Place cheese between the unbuttered sides',
        'Heat a pan over medium heat',
        'Place sandwich in pan and cook until golden',
        'Flip and cook the other side',
        'Cut diagonally and serve hot'
      ]
    }
  ];

  return JSON.stringify({ recipes: fallbackRecipes });
}

// Main function to get recipes from ingredients
export async function getRecipesFromIngredients(ingredients) {
  const ingredientList = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;

  const prompt = `Given these ingredients: ${ingredientList}, suggest 3 simple recipes that can be made with these ingredients. 
  Return the response in this exact JSON format:
  {
    "recipes": [
      {
        "name": "Recipe Name",
        "ingredients": ["ingredient1", "ingredient2"],
        "steps": ["step1", "step2", "step3"]
      }
    ]
  }`;

  try {
    const response = await makeOpenAIApiCall(prompt);

    // Try to parse the response as JSON
    let recipes;
    try {
      const parsed = JSON.parse(response);
      recipes = parsed.recipes || [];
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      console.log('Raw response:', response);
      // Use fallback recipes if parsing fails
      const fallbackResponse = getFallbackRecipes();
      const parsed = JSON.parse(fallbackResponse);
      recipes = parsed.recipes || [];
    }

    // Add IDs to recipes for React keys
    return recipes.map((recipe, index) => ({
      ...recipe,
      id: index + 1
    }));

  } catch (error) {
    console.error('Error getting recipes:', error);
    // Return fallback recipes if API fails
    const fallbackResponse = getFallbackRecipes();
    const parsed = JSON.parse(fallbackResponse);
    return parsed.recipes.map((recipe, index) => ({
      ...recipe,
      id: index + 1
    }));
  }
}

// Function to get detailed steps for a recipe
export async function getRecipeSteps(recipeName, ingredients) {
  const prompt = `Provide detailed step-by-step instructions for making ${recipeName} using these ingredients: ${ingredients.join(', ')}. 
  Return the response as a JSON array of steps:
  ["step1", "step2", "step3"]`;

  try {
    const response = await makeOpenAIApiCall(prompt);

    // Try to parse the response as JSON
    try {
      const steps = JSON.parse(response);
      return Array.isArray(steps) ? steps : [];
    } catch (parseError) {
      console.error('Failed to parse steps response:', parseError);
      console.log('Raw steps response:', response);
      return [];
    }

  } catch (error) {
    console.error('Error getting recipe steps:', error);
    return [];
  }
} 