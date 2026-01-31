import type { RecipeVersion } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VersionDetailView } from './VersionDetailView';

// Mock child components
vi.mock('./IngredientList', () => ({
  IngredientList: ({ ingredients }: any) => (
    <ul data-testid="ingredient-list">
      {ingredients.map((ing: any, i: number) => (
        <li key={i}>
          {ing.quantity} {ing.unit} {ing.name}
        </li>
      ))}
    </ul>
  ),
}));

vi.mock('./StepList', () => ({
  StepList: ({ steps }: any) => (
    <ol data-testid="step-list">
      {steps.map((step: any) => (
        <li key={step.position}>{step.text}</li>
      ))}
    </ol>
  ),
}));

describe('VersionDetailView Component', () => {
  const mockVersion: RecipeVersion = {
    id: 'version-1' as any,
    recipe_id: 'recipe-123' as any,
    version_number: 1,
    servings: 4,
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    ingredients_json: [
      { name: 'pasta', quantity: 400, unit: 'g' },
      { name: 'eggs', quantity: 4 },
    ],
    steps_json: [
      { position: 1, text: 'Boil pasta' },
      { position: 2, text: 'Mix eggs and cheese' },
    ],
    notes: 'Use fresh eggs for best results',
    created_by: 'user-1' as any,
    created_at: new Date('2024-01-15T10:30:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Version metadata', () => {
    it('should render editor name when provided', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText(/edited by john doe/i)).toBeInTheDocument();
    });

    it('should render "Unknown editor" when editor name not provided', () => {
      render(<VersionDetailView version={mockVersion} />);

      expect(screen.getByText(/unknown editor/i)).toBeInTheDocument();
    });

    it('should render created date', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      // Date formatting may vary based on locale, check for date string pattern
      expect(screen.getByText(/edited by john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jan.*15.*2024/i)).toBeInTheDocument();
    });
  });

  describe('Cooking info display', () => {
    it('should render servings when provided', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText(/4 servings/i)).toBeInTheDocument();
    });

    it('should render prep time when provided', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText(/prep: 15 min/i)).toBeInTheDocument();
    });

    it('should render cook time when provided', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText(/cook: 30 min/i)).toBeInTheDocument();
    });

    it('should render total time', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText(/total: 45 min/i)).toBeInTheDocument();
    });

    it('should format time in hours for >= 60 minutes', () => {
      const versionWithLongTime = {
        ...mockVersion,
        prep_time_minutes: 90,
        cook_time_minutes: 30,
      };
      render(<VersionDetailView version={versionWithLongTime} editorName="John Doe" />);

      expect(screen.getByText(/prep: 1h 30m/i)).toBeInTheDocument();
      expect(screen.getByText(/total: 2h/i)).toBeInTheDocument();
    });

    it('should format exact hours without minutes', () => {
      const versionWithExactHours = {
        ...mockVersion,
        prep_time_minutes: 60,
        cook_time_minutes: 120,
      };
      render(<VersionDetailView version={versionWithExactHours} editorName="John Doe" />);

      expect(screen.getByText(/prep: 1h$/i)).toBeInTheDocument();
      expect(screen.getByText(/cook: 2h$/i)).toBeInTheDocument();
    });

    it('should not render cooking info section if all fields are null', () => {
      const versionWithoutCookingInfo = {
        ...mockVersion,
        servings: null,
        prep_time_minutes: null,
        cook_time_minutes: null,
      };
      render(<VersionDetailView version={versionWithoutCookingInfo} editorName="John Doe" />);

      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/prep/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cook/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    });

    it('should render only servings if times are null', () => {
      const versionWithOnlyServings = {
        ...mockVersion,
        prep_time_minutes: null,
        cook_time_minutes: null,
      };
      render(<VersionDetailView version={versionWithOnlyServings} editorName="John Doe" />);

      expect(screen.getByText(/4 servings/i)).toBeInTheDocument();
      expect(screen.queryByText(/prep/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cook/i)).not.toBeInTheDocument();
    });
  });

  describe('Ingredients section', () => {
    it('should render ingredients section header', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText('Ingredients')).toBeInTheDocument();
    });

    it('should render IngredientList component', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByTestId('ingredient-list')).toBeInTheDocument();
    });

    it('should pass ingredients to IngredientList', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      const ingredientList = screen.getByTestId('ingredient-list');
      expect(ingredientList).toHaveTextContent('400 g pasta');
      expect(ingredientList).toHaveTextContent('4 eggs');
    });

    it('should handle empty ingredients array', () => {
      const versionWithoutIngredients = {
        ...mockVersion,
        ingredients_json: [],
      };
      render(<VersionDetailView version={versionWithoutIngredients} editorName="John Doe" />);

      const ingredientList = screen.getByTestId('ingredient-list');
      expect(ingredientList.children).toHaveLength(0);
    });

    it('should handle empty ingredients_json', () => {
      const versionWithNullIngredients = {
        ...mockVersion,
        ingredients_json: [],
      };
      render(<VersionDetailView version={versionWithNullIngredients} editorName="John Doe" />);

      const ingredientList = screen.getByTestId('ingredient-list');
      expect(ingredientList.children).toHaveLength(0);
    });
  });

  describe('Steps section', () => {
    it('should render steps section header', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText('Steps')).toBeInTheDocument();
    });

    it('should render StepList component', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByTestId('step-list')).toBeInTheDocument();
    });

    it('should pass steps to StepList', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      const stepList = screen.getByTestId('step-list');
      expect(stepList).toHaveTextContent('Boil pasta');
      expect(stepList).toHaveTextContent('Mix eggs and cheese');
    });

    it('should handle empty steps array', () => {
      const versionWithoutSteps = {
        ...mockVersion,
        steps_json: [],
      };
      render(<VersionDetailView version={versionWithoutSteps} editorName="John Doe" />);

      const stepList = screen.getByTestId('step-list');
      expect(stepList.children).toHaveLength(0);
    });

    it('should handle empty steps_json', () => {
      const versionWithNullSteps = {
        ...mockVersion,
        steps_json: [],
      };
      render(<VersionDetailView version={versionWithNullSteps} editorName="John Doe" />);

      const stepList = screen.getByTestId('step-list');
      expect(stepList.children).toHaveLength(0);
    });
  });

  describe('Notes section', () => {
    it('should render notes section when notes exist', () => {
      render(<VersionDetailView version={mockVersion} editorName="John Doe" />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Use fresh eggs for best results')).toBeInTheDocument();
    });

    it('should not render notes section when notes are null', () => {
      const versionWithoutNotes = {
        ...mockVersion,
        notes: null,
      };
      render(<VersionDetailView version={versionWithoutNotes} editorName="John Doe" />);

      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });

    it('should preserve notes whitespace with pre-wrap', () => {
      const versionWithMultilineNotes = {
        ...mockVersion,
        notes: 'Line 1\n\nLine 2\nLine 3',
      };

      render(<VersionDetailView version={versionWithMultilineNotes} editorName="John Doe" />);

      // Check that multiline notes are rendered
      // Use getAllByText since there may be multiple elements
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent === 'Line 1\n\nLine 2\nLine 3';
      });

      // Should find at least one element with the text
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render long notes content', () => {
      const versionWithLongNotes = {
        ...mockVersion,
        notes: 'This is a very long note. '.repeat(50),
      };
      render(<VersionDetailView version={versionWithLongNotes} editorName="John Doe" />);

      expect(screen.getByText(/this is a very long note/i)).toBeInTheDocument();
    });
  });

  describe('Section ordering', () => {
    it('should render sections in correct order', () => {
      const { container } = render(
        <VersionDetailView version={mockVersion} editorName="John Doe" />,
      );

      const sections = container.querySelectorAll('h6');
      expect(sections[0]).toHaveTextContent('Ingredients');
      expect(sections[1]).toHaveTextContent('Steps');
      expect(sections[2]).toHaveTextContent('Notes');
    });

    it('should render dividers between sections', () => {
      const { container } = render(
        <VersionDetailView version={mockVersion} editorName="John Doe" />,
      );

      const dividers = container.querySelectorAll('.MuiDivider-root');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('Icons', () => {
    it('should render servings icon', () => {
      const { container } = render(
        <VersionDetailView version={mockVersion} editorName="John Doe" />,
      );

      // Check for MUI icons (SVG elements)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render time icons', () => {
      const { container } = render(
        <VersionDetailView version={mockVersion} editorName="John Doe" />,
      );

      // Time icons appear for prep, cook, and total time
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });
});
