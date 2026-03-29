export type Permission = 'view' | 'edit'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  avatar_url: string | null
  updated_at: string
}

export interface ScaledIngredient {
  qty: string
  ingredient: string
  unit_cost: number | null
  original_line: string
}

export interface Recipe {
  id: string
  user_id: string
  name: string
  source_name: string | null
  author: string | null
  source_url: string | null
  recipe_info: string | null
  instructions: string | null
  chef_notes: string | null
  original_ingredients: string
  original_servings: number
  desired_servings: number
  scaled_ingredients: ScaledIngredient[] | null
  total_cost: number | null
  created_at: string
  updated_at: string
}

export interface RecipeShare {
  id: string
  recipe_id: string
  shared_by: string
  shared_with: string
  shared_email: string
  permission: Permission
  created_at: string
}

// Enriched types used in UI (joined with profiles)
export interface RecipeWithOwner extends Recipe {
  owner: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> & { email: string }
  my_permission?: Permission | 'owner'
}

export interface ShareWithProfile extends RecipeShare {
  profile: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null
}
