export const FACULTY_OPTIONS = [
    { value: 'Computer Science & IT', labelKey: 'option_faculty_cs_it' },
    { value: 'Engineering', labelKey: 'option_faculty_engineering' },
    { value: 'Business & Management', labelKey: 'option_faculty_business' },
    { value: 'Design & Media', labelKey: 'option_faculty_design' },
    { value: 'Arts & Humanities', labelKey: 'option_faculty_arts' },
    { value: 'Law', labelKey: 'option_faculty_law' },
    { value: 'Medical & Health Sciences', labelKey: 'option_faculty_medical' },
    { value: 'Science', labelKey: 'option_faculty_science' },
    { value: 'Architecture & Planning', labelKey: 'option_faculty_architecture' },
    { value: 'Education', labelKey: 'option_faculty_education' },
    { value: 'Social Sciences', labelKey: 'option_faculty_social_sciences' },
    { value: 'Hospitality & Tourism', labelKey: 'option_faculty_hospitality' },
    { value: 'Interdisciplinary', labelKey: 'option_faculty_interdisciplinary' },
    { value: 'Other', labelKey: 'option_common_other' }
];

export const COURSE_OPTIONS = [
    { value: 'B.Tech / BE', labelKey: 'option_course_btech' },
    { value: 'BCA', labelKey: 'option_course_bca' },
    { value: 'MCA', labelKey: 'option_course_mca' },
    { value: 'B.Sc', labelKey: 'option_course_bsc' },
    { value: 'M.Sc', labelKey: 'option_course_msc' },
    { value: 'BBA', labelKey: 'option_course_bba' },
    { value: 'MBA', labelKey: 'option_course_mba' },
    { value: 'BA', labelKey: 'option_course_ba' },
    { value: 'MA', labelKey: 'option_course_ma' },
    { value: 'B.Des', labelKey: 'option_course_bdes' },
    { value: 'M.Des', labelKey: 'option_course_mdes' },
    { value: 'LLB', labelKey: 'option_course_llb' },
    { value: 'MBBS / Medical', labelKey: 'option_course_mbbs' },
    { value: 'Diploma', labelKey: 'option_course_diploma' },
    { value: 'PhD / Research', labelKey: 'option_course_phd' },
    { value: 'Other', labelKey: 'option_common_other' }
];

export const ACADEMIC_YEAR_OPTIONS = [
    { value: '1st year', labelKey: 'option_year_1' },
    { value: '2nd year', labelKey: 'option_year_2' },
    { value: '3rd year', labelKey: 'option_year_3' },
    { value: '4th year', labelKey: 'option_year_4' },
    { value: '5th year', labelKey: 'option_year_5' },
    { value: 'Final year', labelKey: 'option_year_final' },
    { value: 'Postgraduate', labelKey: 'option_year_postgraduate' },
    { value: 'Research scholar', labelKey: 'option_year_research' },
    { value: 'Recently graduated', labelKey: 'option_year_graduated' }
];

export const GOAL_GROUPS = [
    {
        key: 'build',
        titleKey: 'onboarding_goal_group_build_title',
        subtitleKey: 'onboarding_goal_group_build_subtitle',
        options: [
            { value: 'startup', labelKey: 'option_goal_startup' },
            { value: 'hackathon', labelKey: 'option_goal_hackathon' },
            { value: 'portfolio', labelKey: 'option_goal_portfolio' },
            { value: 'open source', labelKey: 'option_goal_open_source' },
            { value: 'product building', labelKey: 'option_goal_product_building' },
            { value: 'side project', labelKey: 'option_goal_side_project' }
        ]
    },
    {
        key: 'creative',
        titleKey: 'onboarding_goal_group_creative_title',
        subtitleKey: 'onboarding_goal_group_creative_subtitle',
        options: [
            { value: 'content creation', labelKey: 'option_goal_content_creation' },
            { value: 'photography', labelKey: 'option_goal_photography' },
            { value: 'design projects', labelKey: 'option_goal_design_projects' },
            { value: 'writing', labelKey: 'option_goal_writing' },
            { value: 'singing', labelKey: 'option_goal_singing' },
            { value: 'dance', labelKey: 'option_goal_dance' }
        ]
    },
    {
        key: 'growth',
        titleKey: 'onboarding_goal_group_growth_title',
        subtitleKey: 'onboarding_goal_group_growth_subtitle',
        options: [
            { value: 'internship', labelKey: 'option_goal_internship' },
            { value: 'career growth', labelKey: 'option_goal_career_growth' },
            { value: 'public speaking', labelKey: 'option_goal_public_speaking' },
            { value: 'leadership', labelKey: 'option_goal_leadership' },
            { value: 'community impact', labelKey: 'option_goal_community_impact' },
            { value: 'networking', labelKey: 'option_goal_networking' }
        ]
    }
];

export const SKILL_GROUPS = [
    {
        key: 'build-skills',
        titleKey: 'onboarding_skill_group_build_title',
        subtitleKey: 'onboarding_skill_group_build_subtitle',
        options: [
            { value: 'react', labelKey: 'option_skill_react' },
            { value: 'node', labelKey: 'option_skill_node' },
            { value: 'python', labelKey: 'option_skill_python' },
            { value: 'product strategy', labelKey: 'option_skill_product_strategy' },
            { value: 'research', labelKey: 'option_skill_research' },
            { value: 'project management', labelKey: 'option_skill_project_management' }
        ]
    },
    {
        key: 'creative-skills',
        titleKey: 'onboarding_skill_group_creative_title',
        subtitleKey: 'onboarding_skill_group_creative_subtitle',
        options: [
            { value: 'ui design', labelKey: 'option_skill_ui_design' },
            { value: 'figma', labelKey: 'option_skill_figma' },
            { value: 'video editing', labelKey: 'option_skill_video_editing' },
            { value: 'writing', labelKey: 'option_skill_writing' },
            { value: 'branding', labelKey: 'option_skill_branding' },
            { value: 'storytelling', labelKey: 'option_skill_storytelling' }
        ]
    },
    {
        key: 'social-skills',
        titleKey: 'onboarding_skill_group_social_title',
        subtitleKey: 'onboarding_skill_group_social_subtitle',
        options: [
            { value: 'public speaking', labelKey: 'option_skill_public_speaking' },
            { value: 'community building', labelKey: 'option_skill_community_building' },
            { value: 'mentoring', labelKey: 'option_skill_mentoring' },
            { value: 'facilitation', labelKey: 'option_skill_facilitation' },
            { value: 'networking', labelKey: 'option_skill_networking' },
            { value: 'event planning', labelKey: 'option_skill_event_planning' }
        ]
    }
];

export const INTEREST_GROUPS = [
    {
        key: 'pop',
        titleKey: 'onboarding_interest_group_pop_title',
        subtitleKey: 'onboarding_interest_group_pop_subtitle',
        options: [
            { value: 'movies', labelKey: 'option_interest_movies' },
            { value: 'music', labelKey: 'option_interest_music' },
            { value: 'anime', labelKey: 'option_interest_anime' },
            { value: 'manga', labelKey: 'option_interest_manga' },
            { value: 'gaming', labelKey: 'option_interest_gaming' },
            { value: 'k-drama', labelKey: 'option_interest_kdrama' }
        ]
    },
    {
        key: 'activity',
        titleKey: 'onboarding_interest_group_activity_title',
        subtitleKey: 'onboarding_interest_group_activity_subtitle',
        options: [
            { value: 'football', labelKey: 'option_interest_football' },
            { value: 'basketball', labelKey: 'option_interest_basketball' },
            { value: 'badminton', labelKey: 'option_interest_badminton' },
            { value: 'gym', labelKey: 'option_interest_gym' },
            { value: 'running', labelKey: 'option_interest_running' },
            { value: 'yoga', labelKey: 'option_interest_yoga' }
        ]
    },
    {
        key: 'lifestyle',
        titleKey: 'onboarding_interest_group_lifestyle_title',
        subtitleKey: 'onboarding_interest_group_lifestyle_subtitle',
        options: [
            { value: 'travel', labelKey: 'option_interest_travel' },
            { value: 'food', labelKey: 'option_interest_food' },
            { value: 'books', labelKey: 'option_interest_books' },
            { value: 'fashion', labelKey: 'option_interest_fashion' },
            { value: 'volunteering', labelKey: 'option_interest_volunteering' },
            { value: 'pets', labelKey: 'option_interest_pets' }
        ]
    },
    {
        key: 'tech',
        titleKey: 'onboarding_interest_group_tech_title',
        subtitleKey: 'onboarding_interest_group_tech_subtitle',
        options: [
            { value: 'ai', labelKey: 'option_interest_ai' },
            { value: 'robotics', labelKey: 'option_interest_robotics' },
            { value: 'fintech', labelKey: 'option_interest_fintech' },
            { value: 'healthtech', labelKey: 'option_interest_healthtech' },
            { value: 'entrepreneurship', labelKey: 'option_interest_entrepreneurship' },
            { value: 'social impact', labelKey: 'option_interest_social_impact' }
        ]
    }
];

const ALL_SIGNAL_OPTIONS = [
    ...GOAL_GROUPS.flatMap((group) => group.options),
    ...SKILL_GROUPS.flatMap((group) => group.options),
    ...INTEREST_GROUPS.flatMap((group) => group.options)
];

const SIGNAL_LABEL_KEYS = {
    collaboration: 'signal_collaboration',
    'project building': 'signal_project_building',
    communication: 'signal_communication',
    teamwork: 'signal_teamwork',
    technology: 'signal_technology',
    learning: 'signal_learning'
};

export const getOptionLabelKey = (options, value) => (
    options.find((option) => option.value === value)?.labelKey || null
);

export const getSignalLabelKey = (value) => (
    SIGNAL_LABEL_KEYS[value]
    || ALL_SIGNAL_OPTIONS.find((option) => option.value === value)?.labelKey
    || null
);
