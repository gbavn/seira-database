// ==================== SEIRA RPG DATABASE - JAVASCRIPT ====================
// Parte 1: Constantes, Configuração Inicial e Funções Auxiliares

// ==================== CONFIGURAÇÃO DE FORMAS REGIONAIS ====================
// INSTRUÇÕES: Adicione os IDs das formas regionais de cada região
// Se a lista estiver incorreta, edite aqui adicionando/removendo IDs
const REGIONAL_FORMS = {
    alola: [
        // Adicione IDs de formas Alola aqui
        // Exemplo: 10100, 10101, 10102, etc.
    ],
    galar: [
        // Adicione IDs de formas Galar aqui
    ],
    hisui: [
        // Adicione IDs de formas Hisui aqui
    ],
    paldea: [
        // Adicione IDs de formas Paldea aqui
    ],
    seira: [
        // Adicione IDs de formas Seira aqui
    ]
};

// ==================== URLs DAS APIs JSON ====================
const API_URLS = {
    pokemon: 'https://raw.githubusercontent.com/gbavn/seira-database/main/database/pokemon.json',
    moves: 'https://raw.githubusercontent.com/gbavn/seira-database/main/database/moves.json',
    abilities: 'https://raw.githubusercontent.com/gbavn/seira-database/main/database/abilities.json',
    items: 'https://raw.githubusercontent.com/gbavn/seira-database/main/database/items.json',
    maps: 'https://raw.githubusercontent.com/gbavn/seira-database/main/database/maps.json',
    objects: 'https://raw.githubusercontent.com/gbavn/seira-database/main/database/objects.json'
};

// ==================== CACHE DE DADOS ====================
let DATA_CACHE = {
    pokemon: [],
    moves: [],
    abilities: [],
    items: [],
    maps: [],
    objects: []
};

// ==================== ESTADO DOS FILTROS ====================
let FILTERS = {
    pokemon: {},
    items: {},
    moves: {},
    abilities: {},
    maps: {},
    objects: {}
};

// ==================== ESTADO DA PAGINAÇÃO ====================
let PAGINATION = {
    pokemon: { currentPage: 1, perPage: 15 },
    items: { currentPage: 1, perPage: 15 },
    moves: { currentPage: 1, perPage: 15 },
    abilities: { currentPage: 1, perPage: 15 },
    objects: { currentPage: 1, perPage: 15 }
};

// ==================== FUNÇÕES AUXILIARES DE TEXTO ====================

/**
 * Capitaliza a primeira letra de cada palavra
 */
function capitalizeWords(string) {
    if (!string) return '';
    return string.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Traduz categoria de item para português
 */
function translateItemCategory(category) {
    const translations = {
        'medicine': 'Consumíveis',
        'key-item': 'Itens Chave',
        'pokeball': 'Pokébolas',
        'other': 'Outros',
        'berry': 'Berries',
        'held-item': 'Held Items',
        'tm': 'TMs',
        'craft-material': 'Materiais de Craft',
        'evolution-item': 'Item de Evolução'
    };
    return translations[category] || category;
}

/**
 * Traduz tipo de mapa para português
 */
function translateMapType(type) {
    const translations = {
        'city': 'Cidade',
        'route': 'Rota',
        'landmark': 'Landmark'
    };
    return translations[type] || type;
}

/**
 * Traduz tipo de objeto para português
 */
function translateObjectType(type) {
    const translations = {
        'berry_tree': 'Árvore de Berries',
        'apricorn_tree': 'Árvore de Apricorn',
        'fishing_spot': 'Ponto de Pesca',
        'evolution_stone': 'Pedra de Evolução',
        'evolution_location': 'Local de Evolução',
        'social_spot': 'Local Social'
    };
    return translations[type] || type;
}

/**
 * Retorna o número da Dex de um Pokémon
 * Se for forma especial (ID > 10000), retorna o número da forma base
 */
function getDexNumber(pokemon) {
    if (pokemon.id >= 10000 && pokemon.form_of) {
        return pokemon.form_of;
    }
    return pokemon.id;
}

/**
 * Formata nome do Pokémon com informação de forma se necessário
 */
function formatPokemonName(pokemon) {
    let name = pokemon.name;
    
    // Se não for forma base e tiver tipo de forma, adiciona ao nome
    if (!pokemon.base_form && pokemon.form_type) {
        const formTypes = {
            'mega': 'Mega',
            'gigantamax': 'Gigantamax',
            'regional': pokemon.name.includes('Alolan') || pokemon.name.includes('Galarian') || 
                       pokemon.name.includes('Hisuian') || pokemon.name.includes('Paldean') || 
                       pokemon.name.includes('Seirian') ? '' : 'Regional'
        };
        const formLabel = formTypes[pokemon.form_type] || '';
        if (formLabel && !name.includes(formLabel)) {
            name = `${name} (${formLabel})`;
        }
    }
    
    return name;
}

/**
 * Verifica se um Pokémon pertence a uma região específica
 */
function isPokemonFromRegion(pokemon, region) {
    if (!region) return true;
    
    // Verifica se o ID está na lista de formas regionais
    if (REGIONAL_FORMS[region] && REGIONAL_FORMS[region].includes(pokemon.id)) {
        return true;
    }
    
    // Verifica pelo nome (fallback)
    const regionKeywords = {
        'alola': ['alolan', 'alola'],
        'galar': ['galarian', 'galar'],
        'hisui': ['hisuian', 'hisui'],
        'paldea': ['paldean', 'paldea'],
        'seira': ['seirian', 'seira']
    };
    
    const keywords = regionKeywords[region] || [];
    const pokemonName = pokemon.name.toLowerCase();
    
    return keywords.some(keyword => pokemonName.includes(keyword));
}

// ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================

/**
 * Carrega dados de uma API específica
 */
async function loadData(key) {
    // Retorna do cache se já foi carregado
    if (DATA_CACHE[key].length > 0) {
        return DATA_CACHE[key];
    }
    
    try {
        console.log(`📥 Carregando ${key}...`);
        const response = await fetch(API_URLS[key]);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        DATA_CACHE[key] = data;
        console.log(`✅ ${key} carregado: ${data.length} itens`);
        return data;
    } catch (error) {
        console.error(`❌ Erro ao carregar ${key}:`, error);
        return [];
    }
}

/**
 * Inicializa todos os dados necessários
 */
async function initializeData() {
    console.log('🚀 Iniciando carregamento de dados...');
    
    await Promise.all([
        loadData('pokemon'),
        loadData('moves'),
        loadData('abilities'),
        loadData('items'),
        loadData('maps'),
        loadData('objects')
    ]);
    
    // Popula filtros dinâmicos
    populateTypeFilters();
    populateItemCategoryFilters();
    populateBiomeFilters();
    
    console.log('✅ Todos os dados carregados!');
}

/**
 * Popula filtros de tipos dinamicamente
 */
function populateTypeFilters() {
    const types = [
        'Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting', 'Fire', 'Flying',
        'Ghost', 'Grass', 'Ground', 'Ice', 'Normal', 'Poison', 'Psychic', 'Rock', 'Steel', 'Water'
    ];
    
    const pokemonTypeSelect = document.getElementById('pokemon-type');
    const moveTypeSelect = document.getElementById('move-type');
    
    types.forEach(type => {
        const option1 = document.createElement('option');
        option1.value = type;
        option1.textContent = type;
        pokemonTypeSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = type;
        option2.textContent = type;
        moveTypeSelect.appendChild(option2);
    });
}

/**
 * Popula filtros de categorias de itens
 */
async function populateItemCategoryFilters() {
    const items = await loadData('items');
    const categories = [...new Set(items.map(i => i.category))].sort();
    
    const select = document.getElementById('item-category');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = translateItemCategory(cat);
        select.appendChild(option);
    });
}

/**
 * Popula filtros de biomas
 */
async function populateBiomeFilters() {
    const maps = await loadData('maps');
    const biomes = [...new Set(maps.map(m => m.biome))].filter(Boolean).sort();
    
    const select = document.getElementById('map-biome');
    biomes.forEach(biome => {
        const option = document.createElement('option');
        option.value = biome;
        option.textContent = biome;
        select.appendChild(option);
    });
}

// ==================== FUNÇÕES DE ÍCONES ====================

/**
 * Retorna o ícone GMI apropriado para um stat
 */
function getStatIcon(statName) {
    const icons = {
        'hp': 'gmi-glass-heart',
        'attack': 'gmi-fist',
        'defense': 'gmi-bordered-shield',
        'special_attack': 'gmi-hypersonic-bolt',
        'special_defense': 'gmi-bolt-shield',
        'speed': 'gmi-steelwing-emblem'
    };
    return icons[statName] || 'gmi-star';
}

/**
 * Retorna o nome traduzido de um stat
 */
function getStatName(statName) {
    const names = {
        'hp': 'HP',
        'attack': 'ATQ',
        'defense': 'DEF',
        'special_attack': 'ATQ ESP.',
        'special_defense': 'DEF ESP.',
        'speed': 'VEL'
    };
    return names[statName] || statName.toUpperCase();
}

// ==================== NAVEGAÇÃO ENTRE TABS ====================

/**
 * Configura a navegação entre as seções principais
 */
function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tabs:not(.shop-tabs):not(.map-tabs) .nav-tab');
    const contentSections = document.querySelectorAll('.content-section');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active de todas as tabs e seções
            navTabs.forEach(t => t.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            
            // Adiciona active na tab clicada
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Carrega dados da seção
            loadSectionData(targetTab);
        });
    });
}

/**
 * Carrega dados específicos de uma seção
 */
async function loadSectionData(section) {
    switch(section) {
        case 'pokedex':
            await renderPokemonGrid();
            break;
        case 'itemdex':
            await renderItemGrid();
            break;
        case 'movedex':
            await renderMoveGrid();
            break;
        case 'abilitydex':
            await renderAbilityGrid();
            break;
        case 'shops':
            await renderShops();
            break;
        case 'maps':
            await renderMaps();
            break;
        case 'objects':
            await renderObjectGrid();
            break;
    }
}

/**
 * Configura modal
 */
function setupModal() {
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modal-close');
    
    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// ==================== SISTEMA DE SPOILERS ====================

/**
 * Cria um elemento spoiler para listas longas
 */
function createSpoiler(label, content) {
    const spoilerHTML = `
        <div class="spoiler-toggle" onclick="toggleSpoiler(this)">
            <span>${label}</span>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="spoiler-content">
            ${content}
        </div>
    `;
    return spoilerHTML;
}

/**
 * Alterna visibilidade do spoiler
 */
function toggleSpoiler(element) {
    element.classList.toggle('active');
    const content = element.nextElementSibling;
    content.classList.toggle('active');
}
// ==================== PARTE 2: SISTEMA DE FILTROS ====================

/**
 * Configura event listeners dos filtros
 */
function setupFilters() {
    // ==================== FILTROS DA POKÉDEX ====================
    
    document.getElementById('pokemon-search').addEventListener('input', (e) => {
        FILTERS.pokemon.search = e.target.value;
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-type').addEventListener('change', (e) => {
        FILTERS.pokemon.type = e.target.value;
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-rarity').addEventListener('change', (e) => {
        FILTERS.pokemon.rarity = e.target.value;
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-form').addEventListener('change', (e) => {
        FILTERS.pokemon.form = e.target.value;
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-region').addEventListener('change', (e) => {
        FILTERS.pokemon.region = e.target.value;
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-starter-filter').addEventListener('click', (e) => {
        FILTERS.pokemon.starter = !FILTERS.pokemon.starter;
        e.target.classList.toggle('active');
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-seira-filter').addEventListener('click', (e) => {
        FILTERS.pokemon.seira = !FILTERS.pokemon.seira;
        e.target.classList.toggle('active');
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-producer-filter').addEventListener('click', (e) => {
        FILTERS.pokemon.producer = !FILTERS.pokemon.producer;
        e.target.classList.toggle('active');
        PAGINATION.pokemon.currentPage = 1;
        renderPokemonGrid();
    });
    
    document.getElementById('pokemon-clear-filters').addEventListener('click', () => {
        FILTERS.pokemon = {};
        PAGINATION.pokemon.currentPage = 1;
        document.getElementById('pokemon-search').value = '';
        document.getElementById('pokemon-type').value = '';
        document.getElementById('pokemon-rarity').value = '';
        document.getElementById('pokemon-form').value = '';
        document.getElementById('pokemon-region').value = '';
        document.querySelectorAll('#pokedex .filter-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        renderPokemonGrid();
    });
    
    // ==================== FILTROS DO ITEMDEX ====================
    
    document.getElementById('item-search').addEventListener('input', (e) => {
        FILTERS.items.search = e.target.value;
        PAGINATION.items.currentPage = 1;
        renderItemGrid();
    });
    
    document.getElementById('item-category').addEventListener('change', (e) => {
        FILTERS.items.category = e.target.value;
        PAGINATION.items.currentPage = 1;
        renderItemGrid();
    });
    
    document.getElementById('item-rarity').addEventListener('change', (e) => {
        FILTERS.items.rarity = e.target.value;
        PAGINATION.items.currentPage = 1;
        renderItemGrid();
    });
    
    document.getElementById('item-craftable-filter').addEventListener('click', (e) => {
        FILTERS.items.craftable = !FILTERS.items.craftable;
        e.target.classList.toggle('active');
        PAGINATION.items.currentPage = 1;
        renderItemGrid();
    });
    
    document.getElementById('item-forageable-filter').addEventListener('click', (e) => {
        FILTERS.items.forageable = !FILTERS.items.forageable;
        e.target.classList.toggle('active');
        PAGINATION.items.currentPage = 1;
        renderItemGrid();
    });
    
    document.getElementById('item-book-filter').addEventListener('click', (e) => {
        FILTERS.items.book = !FILTERS.items.book;
        e.target.classList.toggle('active');
        PAGINATION.items.currentPage = 1;
        renderItemGrid();
    });
    
    document.getElementById('item-clear-filters').addEventListener('click', () => {
        FILTERS.items = {};
        PAGINATION.items.currentPage = 1;
        document.getElementById('item-search').value = '';
        document.getElementById('item-category').value = '';
        document.getElementById('item-rarity').value = '';
        document.querySelectorAll('#itemdex .filter-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        renderItemGrid();
    });
    
    // ==================== FILTROS DO MOVEDEX ====================
    
    document.getElementById('move-search').addEventListener('input', (e) => {
        FILTERS.moves.search = e.target.value;
        PAGINATION.moves.currentPage = 1;
        renderMoveGrid();
    });
    
    document.getElementById('move-type').addEventListener('change', (e) => {
        FILTERS.moves.type = e.target.value;
        PAGINATION.moves.currentPage = 1;
        renderMoveGrid();
    });
    
    document.getElementById('move-category').addEventListener('change', (e) => {
        FILTERS.moves.category = e.target.value;
        PAGINATION.moves.currentPage = 1;
        renderMoveGrid();
    });
    
    document.getElementById('move-class').addEventListener('change', (e) => {
        FILTERS.moves.move_class = e.target.value;
        PAGINATION.moves.currentPage = 1;
        renderMoveGrid();
    });
    
    document.getElementById('move-modified-filter').addEventListener('click', (e) => {
        FILTERS.moves.modified = !FILTERS.moves.modified;
        e.target.classList.toggle('active');
        PAGINATION.moves.currentPage = 1;
        renderMoveGrid();
    });
    
    document.getElementById('move-clear-filters').addEventListener('click', () => {
        FILTERS.moves = {};
        PAGINATION.moves.currentPage = 1;
        document.getElementById('move-search').value = '';
        document.getElementById('move-type').value = '';
        document.getElementById('move-category').value = '';
        document.getElementById('move-class').value = '';
        document.querySelectorAll('#movedex .filter-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        renderMoveGrid();
    });
    
    // ==================== FILTROS DO ABILITYDEX ====================
    
    document.getElementById('ability-search').addEventListener('input', (e) => {
        FILTERS.abilities.search = e.target.value;
        PAGINATION.abilities.currentPage = 1;
        renderAbilityGrid();
    });
    
    document.getElementById('ability-modified-filter').addEventListener('click', (e) => {
        FILTERS.abilities.modified = !FILTERS.abilities.modified;
        e.target.classList.toggle('active');
        PAGINATION.abilities.currentPage = 1;
        renderAbilityGrid();
    });
    
    document.getElementById('ability-clear-filters').addEventListener('click', () => {
        FILTERS.abilities = {};
        PAGINATION.abilities.currentPage = 1;
        document.getElementById('ability-search').value = '';
        document.querySelectorAll('#abilitydex .filter-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        renderAbilityGrid();
    });
    
    // ==================== FILTROS DE MAPAS ====================
    
    document.getElementById('map-type').addEventListener('change', () => renderMapCards());
    document.getElementById('map-biome').addEventListener('change', () => renderMapCards());
    
    // ==================== FILTROS DE OBJETOS ====================
    
    document.getElementById('object-search').addEventListener('input', (e) => {
        FILTERS.objects.search = e.target.value;
        PAGINATION.objects.currentPage = 1;
        renderObjectGrid();
    });
    
    document.getElementById('object-type').addEventListener('change', (e) => {
        FILTERS.objects.type = e.target.value;
        PAGINATION.objects.currentPage = 1;
        renderObjectGrid();
    });
    
    document.getElementById('object-clear-filters').addEventListener('click', () => {
        FILTERS.objects = {};
        PAGINATION.objects.currentPage = 1;
        document.getElementById('object-search').value = '';
        document.getElementById('object-type').value = '';
        renderObjectGrid();
    });
}

// ==================== FUNÇÕES DE FILTRAGEM ====================

/**
 * Filtra Pokémon baseado nos filtros ativos
 */
function filterPokemon(pokemon) {
    let filtered = [...pokemon];
    
    // Busca por nome/número da Dex
    if (FILTERS.pokemon.search) {
        const search = FILTERS.pokemon.search.toLowerCase();
        filtered = filtered.filter(p => {
            const dexNum = getDexNumber(p).toString();
            return p.name.toLowerCase().includes(search) || dexNum.includes(search);
        });
    }
    
    // Filtro de tipo
    if (FILTERS.pokemon.type) {
        filtered = filtered.filter(p => 
            p.types.some(t => t.toLowerCase() === FILTERS.pokemon.type.toLowerCase())
        );
    }
    
    // Filtro de raridade
    if (FILTERS.pokemon.rarity) {
        filtered = filtered.filter(p => p.rarity === FILTERS.pokemon.rarity);
    }
    
    // Filtro de forma
    if (FILTERS.pokemon.form === 'base') {
        filtered = filtered.filter(p => p.base_form === true);
    } else if (FILTERS.pokemon.form) {
        filtered = filtered.filter(p => p.form_type === FILTERS.pokemon.form);
    }
    
    // Filtro de região
    if (FILTERS.pokemon.region) {
        filtered = filtered.filter(p => isPokemonFromRegion(p, FILTERS.pokemon.region));
    }
    
    // Filtros booleanos
    if (FILTERS.pokemon.starter) {
        filtered = filtered.filter(p => p.is_starter);
    }
    if (FILTERS.pokemon.seira) {
        filtered = filtered.filter(p => p.in_seira_pokedex);
    }
    if (FILTERS.pokemon.producer) {
        filtered = filtered.filter(p => p.is_producer);
    }
    
    return filtered;
}

/**
 * Filtra itens baseado nos filtros ativos
 */
function filterItems(items) {
    let filtered = [...items];
    
    if (FILTERS.items.search) {
        const search = FILTERS.items.search.toLowerCase();
        filtered = filtered.filter(i => 
            i.name.toLowerCase().includes(search) || 
            i.id.toString().includes(search)
        );
    }
    
    if (FILTERS.items.category) {
        filtered = filtered.filter(i => i.category === FILTERS.items.category);
    }
    
    if (FILTERS.items.rarity) {
        filtered = filtered.filter(i => i.rarity === FILTERS.items.rarity);
    }
    
    if (FILTERS.items.craftable) {
        filtered = filtered.filter(i => i.is_craftable);
    }
    
    if (FILTERS.items.forageable) {
        filtered = filtered.filter(i => i.forageable);
    }
    
    if (FILTERS.items.book) {
        filtered = filtered.filter(i => i.is_book);
    }
    
    return filtered;
}

/**
 * Filtra moves baseado nos filtros ativos
 */
function filterMoves(moves) {
    let filtered = [...moves];

    if (FILTERS.moves.search) {
        const search = FILTERS.moves.search.toLowerCase();
        filtered = filtered.filter(m => m.name.toLowerCase().includes(search));
    }
    
    if (FILTERS.moves.type) {
        filtered = filtered.filter(m => m.type.toLowerCase() === FILTERS.moves.type.toLowerCase());
    }
    
    if (FILTERS.moves.category) {
        filtered = filtered.filter(m => m.category === FILTERS.moves.category);
    }
    
    if (FILTERS.moves.move_class) {
        filtered = filtered.filter(m => m.move_class === FILTERS.moves.move_class);
    }
    
    if (FILTERS.moves.modified) {
        filtered = filtered.filter(m => m.modified_for_rpg);
    }
    
    return filtered;
}

/**
 * Filtra abilities baseado nos filtros ativos
 */
function filterAbilities(abilities) {
    let filtered = [...abilities];
    
    if (FILTERS.abilities.search) {
        const search = FILTERS.abilities.search.toLowerCase();
        filtered = filtered.filter(a => a.name.toLowerCase().includes(search));
    }
    
    if (FILTERS.abilities.modified) {
        filtered = filtered.filter(a => a.modified_for_rpg);
    }
    
    return filtered;
}

/**
 * Filtra objetos baseado nos filtros ativos
 */
function filterObjects(objects) {
    let filtered = [...objects];
    
    if (FILTERS.objects.search) {
        const search = FILTERS.objects.search.toLowerCase();
        filtered = filtered.filter(o => 
            o.name.toLowerCase().includes(search) || 
            o.id.toLowerCase().includes(search)
        );
    }
    
    if (FILTERS.objects.type) {
        filtered = filtered.filter(o => o.type === FILTERS.objects.type);
    }
    
    return filtered;
}

/**
 * Filtra mapas (remove ocultos)
 */
function filterMaps(maps) {
    return maps.filter(map => !HIDDEN_MAPS.includes(map.id));
}
// ==================== PARTE 3: RENDERIZAÇÃO DE POKÉMON ====================

/**
 * Renderiza o grid de Pokémon com paginação
 */
async function renderPokemonGrid() {
    const grid = document.getElementById('pokemon-grid');
    const resultsInfo = document.getElementById('pokemon-results-info');
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Carregando Pokémon...</p></div>';
    
    const pokemon = await loadData('pokemon');
    const filtered = filterPokemon(pokemon);
    
    // Calcula paginação
    const { currentPage, perPage } = PAGINATION.pokemon;
    const totalPages = Math.ceil(filtered.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    // Atualiza info de resultados
    resultsInfo.innerHTML = `
        <span>Mostrando ${startIndex + 1}-${Math.min(endIndex, filtered.length)} de ${filtered.length} Pokémon</span>
    `;
    
    // Renderiza cards
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="empty-state-text">Nenhum Pokémon encontrado</p>
                <p>Tente ajustar os filtros</p>
            </div>
        `;
        document.getElementById('pokemon-pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = paginatedData.map(pkmn => createPokemonCard(pkmn)).join('');
    
    // Renderiza paginação
    renderPagination('pokemon', totalPages, currentPage);
}

/**
 * Cria um card de Pokémon
 */
function createPokemonCard(pokemon) {
    const dexNum = getDexNumber(pokemon);
    const bst = Object.values(pokemon.stats).reduce((a, b) => a + b, 0);
    
    const typesHTML = pokemon.types.map(type => 
        `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`
    ).join('');
    
    const badges = [];
    if (pokemon.is_starter) badges.push('<span class="info-badge starter">INICIAL</span>');
    if (pokemon.in_seira_pokedex) badges.push('<span class="info-badge seira">SEIRA</span>');
    if (pokemon.is_producer) badges.push('<span class="info-badge producer">PRODUTOR</span>');
    badges.push(`<span class="info-badge rarity-${pokemon.rarity}">${pokemon.rarity.toUpperCase()}</span>`);
    
    // Badge de forma se não for base
    let formBadge = '';
    if (!pokemon.base_form && pokemon.form_type) {
        const formNames = {
            'mega': 'MEGA',
            'gigantamax': 'G-MAX',
            'regional': 'REGIONAL'
        };
        formBadge = `<span class="info-badge" style="background: #6c757d;">${formNames[pokemon.form_type] || pokemon.form_type.toUpperCase()}</span>`;
    }
    
    return `
        <div class="pokemon-card" onclick="openPokemonModal(${pokemon.id})">
            <div class="pokemon-card-image">
                <img src="${pokemon.artwork}" alt="${pokemon.name}" loading="lazy">
            </div>
            <div class="pokemon-card-header">
                <span class="pokemon-card-id">#${String(dexNum).padStart(3, '0')}</span>
            </div>
            <div class="pokemon-card-name">${pokemon.name}</div>
            <div class="pokemon-types">${typesHTML}</div>
            <div class="pokemon-badges">${badges.join('')}${formBadge}</div>
            <div class="pokemon-stats">BST: ${bst}</div>
        </div>
    `;
}

/**
 * Abre modal com detalhes completos do Pokémon
 */
async function openPokemonModal(pokemonId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const pokemon = DATA_CACHE.pokemon.find(p => p.id === pokemonId);
    if (!pokemon) return;
    
    const moves = DATA_CACHE.moves;
    const maps = DATA_CACHE.maps;
    const items = DATA_CACHE.items;
    const allPokemon = DATA_CACHE.pokemon;
    
    // Título
    modalTitle.innerHTML = `
        <img src="${pokemon.artwork}" style="width: 60px; height: 60px; object-fit: contain;">
        #${String(getDexNumber(pokemon)).padStart(3, '0')} - ${pokemon.name}
    `;
    
    // Verifica se existem formas alternativas (Mega, Gigantamax)
    const alternateForms = allPokemon.filter(p => 
        p.form_of === pokemon.id && 
        !p.base_form && 
        (p.form_type === 'mega' || p.form_type === 'gigantamax')
    );
    
    // Verifica se existem variações (Regional, Exótica)
    const variations = allPokemon.filter(p => 
        p.form_of === pokemon.id && 
        !p.base_form && 
        p.form_type === 'regional'
    );
    
    // Se tiver formas alternativas, criar tabs
    let tabsHTML = '';
    let formsContentHTML = '';
    
    if (alternateForms.length > 0) {
        tabsHTML = `
            <div class="form-tabs">
                <div class="form-tab active" data-form-id="${pokemon.id}">Base</div>
                ${alternateForms.map(form => `
                    <div class="form-tab" data-form-id="${form.id}">
                        ${form.form_type === 'mega' ? 'Mega' : 'Gigantamax'}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Conteúdo da forma base
        formsContentHTML += `<div class="form-content active" data-form-id="${pokemon.id}">
            ${generatePokemonDetails(pokemon, moves, maps, items, allPokemon)}
        </div>`;
        
        // Conteúdo das formas alternativas
        alternateForms.forEach(form => {
            formsContentHTML += `<div class="form-content" data-form-id="${form.id}">
                ${generatePokemonDetails(form, moves, maps, items, allPokemon)}
            </div>`;
        });
    } else {
        // Sem formas alternativas, mostrar apenas base
        formsContentHTML = generatePokemonDetails(pokemon, moves, maps, items, allPokemon);
    }
    
    // Se tiver variações (regionais), adicionar seção
    let variationsHTML = '';
    if (variations.length > 0) {
        variationsHTML = `
            <div class="variations-section">
                <div class="variations-title">
                    <i class="fas fa-globe"></i> Variações Regionais/Exóticas
                </div>
                <div class="variations-grid">
                    ${variations.map(variant => `
                        <div class="variation-card" onclick="openPokemonModal(${variant.id})">
                            <div class="variation-image">
                                <img src="${variant.artwork}" alt="${variant.name}">
                            </div>
                            <div class="variation-name">${variant.name}</div>
                            <div class="variation-type">${variant.form_type}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    modalBody.innerHTML = tabsHTML + formsContentHTML + variationsHTML;
    
    // Setup tabs se existirem
    if (alternateForms.length > 0) {
        setupFormTabs();
    }
    
    modal.classList.add('active');
}

/**
 * Configura tabs de formas alternativas
 */
function setupFormTabs() {
    const tabs = document.querySelectorAll('.form-tab');
    const contents = document.querySelectorAll('.form-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const formId = tab.dataset.formId;
            
            // Remove active de todas
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Adiciona active na selecionada
            tab.classList.add('active');
            document.querySelector(`.form-content[data-form-id="${formId}"]`).classList.add('active');
        });
    });
}

/**
 * Gera HTML com detalhes completos de um Pokémon
 */
function generatePokemonDetails(pokemon, moves, maps, items, allPokemon) {
    // ID da espécie (visível no modal)
    const speciesIdHTML = pokemon.id >= 10000 ? `
        <div class="info-item">
            <span class="info-label">ID da Espécie</span>
            <span class="info-value">#${pokemon.id}</span>
        </div>
    ` : '';
    
    // Tipos
    const typesHTML = pokemon.types.map(type => 
        `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`
    ).join('');
    
    const bst = Object.values(pokemon.stats).reduce((a, b) => a + b, 0);
    
    // Abilities (suporta múltiplas hidden e exóticas)
    const normalAbilities = Array.isArray(pokemon.abilities.normal) 
        ? pokemon.abilities.normal.join(', ') 
        : pokemon.abilities.normal;
    
    let hiddenAbilities = 'Nenhuma';
    if (pokemon.abilities.hidden) {
        hiddenAbilities = Array.isArray(pokemon.abilities.hidden)
            ? pokemon.abilities.hidden.join(', ')
            : pokemon.abilities.hidden;
    }
    
    let exoticAbilities = '';
    if (pokemon.abilities.exotic && pokemon.abilities.exotic.length > 0) {
        exoticAbilities = `
            <div class="info-item">
                <span class="info-label">Exóticas</span>
                <span class="info-value">${pokemon.abilities.exotic.join(', ')}</span>
            </div>
        `;
    }
    
    // Egg Groups
    const eggGroups = pokemon.egg_groups ? pokemon.egg_groups.join(', ') : 'N/A';
    
    // Gender Ratio
    let genderHTML = 'Sem gênero';
    if (pokemon.gender) {
        genderHTML = `♂ ${pokemon.gender.male}% / ♀ ${pokemon.gender.female}%`;
    }
    
    // Stats com ícones GMI e barras
    const statsHTML = `
        <div class="stats-grid">
            ${Object.entries(pokemon.stats).map(([stat, value]) => {
                const maxStat = 255;
                const percentage = (value / maxStat) * 100;
                return `
                    <div class="stat-item">
                        <div class="stat-icon"><i class="gmi ${getStatIcon(stat)}"></i></div>
                        <span class="stat-name">${getStatName(stat)}</span>
                        <span class="stat-value">${value}</span>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // Moveset por level com estilo especial
    let movesetHTML = '';
    if (pokemon.moveset_by_level && pokemon.moveset_by_level.length > 0) {
        const firstMoves = pokemon.moveset_by_level.slice(0, 12);
        const remainingMoves = pokemon.moveset_by_level.slice(12);
        
        const movesWithTypes = firstMoves.map(m => {
            const moveData = moves.find(mv => mv.name.toLowerCase() === m.move.toLowerCase());
            const moveType = moveData ? moveData.type.toLowerCase() : 'normal';
            return `<div class="move ${moveType}">${capitalizeWords(m.move)} (Lv ${m.level})</div>`;
        });
        
        movesetHTML = `<div class="tabpokemoves">${movesWithTypes.join('')}</div>`;
        
        // Se tiver mais moves, adicionar spoiler
        if (remainingMoves.length > 0) {
            const remainingMovesHTML = remainingMoves.map(m => {
                const moveData = moves.find(mv => mv.name.toLowerCase() === m.move.toLowerCase());
                const moveType = moveData ? moveData.type.toLowerCase() : 'normal';
                return `<div class="move ${moveType}">${capitalizeWords(m.move)} (Lv ${m.level})</div>`;
            }).join('');
            
            movesetHTML += createSpoiler(
                `Ver mais ${remainingMoves.length} golpes`,
                `<div class="tabpokemoves">${remainingMovesHTML}</div>`
            );
        }
    } else {
        movesetHTML = '<p>Nenhum golpe natural</p>';
    }
    
    // Learnable Moves (TMs/TRs/Tutors)
    let learnableMovesHTML = '';
    if (pokemon.learnable_moves && pokemon.learnable_moves.length > 0) {
        const firstLearnable = pokemon.learnable_moves.slice(0, 12);
        const remainingLearnable = pokemon.learnable_moves.slice(12);
        
        const learnableMoves = firstLearnable.map(moveName => {
            const moveData = moves.find(mv => mv.name.toLowerCase() === moveName.toLowerCase());
            const moveType = moveData ? moveData.type.toLowerCase() : 'normal';
            return `<div class="move ${moveType}">${capitalizeWords(moveName)}</div>`;
        });
        
        learnableMovesHTML = `<div class="tabpokemoves">${learnableMoves.join('')}</div>`;
        
        // Spoiler se tiver mais
        if (remainingLearnable.length > 0) {
            const remainingHTML = remainingLearnable.map(moveName => {
                const moveData = moves.find(mv => mv.name.toLowerCase() === moveName.toLowerCase());
                const moveType = moveData ? moveData.type.toLowerCase() : 'normal';
                return `<div class="move ${moveType}">${capitalizeWords(moveName)}</div>`;
            }).join('');
            
            learnableMovesHTML += createSpoiler(
                `Ver mais ${remainingLearnable.length} golpes`,
                `<div class="tabpokemoves">${remainingHTML}</div>`
            );
        }
    } else {
        learnableMovesHTML = '<p>Nenhum golpe aprendível</p>';
    }
    
    // Egg Moves
    let eggMovesHTML = '';
    if (pokemon.egg_moves && pokemon.egg_moves.length > 0) {
        const eggMovesList = pokemon.egg_moves.map(moveName => {
            const moveData = moves.find(mv => mv.name.toLowerCase() === moveName.toLowerCase());
            const moveType = moveData ? moveData.type.toLowerCase() : 'normal';
            return `<div class="move ${moveType}">${capitalizeWords(moveName)}</div>`;
        });
        eggMovesHTML = `<div class="tabpokemoves">${eggMovesList.join('')}</div>`;
    } else {
        eggMovesHTML = '<p>Nenhum egg move</p>';
    }
    
    // Localizações
    const locations = maps.filter(map =>
        map.spawns && (
            map.spawns.common.includes(pokemon.id) ||
            map.spawns.rare.includes(pokemon.id) ||
            map.spawns.epic.includes(pokemon.id)
        )
    );
    
    const locationsHTML = locations.length > 0
        ? locations.map(map => {
            let rarity = 'comum';
            if (map.spawns.rare.includes(pokemon.id)) rarity = 'raro';
            if (map.spawns.epic.includes(pokemon.id)) rarity = 'épico';
            return `<div class="info-badge rarity-${rarity}" style="cursor: pointer;" onclick="openMapModal('${map.id}')">${map.name} (${rarity})</div>`;
        }).join('')
        : '<p>Não encontrado em mapas</p>';
    
    // Produção (se for produtor)
    let productionHTML = '';
    if (pokemon.is_producer && pokemon.production && pokemon.production.length > 0) {
        const productionItems = pokemon.production.map(prod => {
            if (prod.item_id) {
                const item = items.find(i => i.id === prod.item_id);
                return item ? `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--dark3); border-radius: 6px; cursor: pointer;" onclick="openItemModal(${item.id})">
                        <img src="${item.sprite}" style="width: 48px; height: 48px;">
                        <div>
                            <div style="font-weight: 700;">${item.name}</div>
                            <div style="font-size: 12px; color: var(--white1);">${prod.description || ''}</div>
                        </div>
                    </div>
                ` : '';
            }
            return `<p>${prod.description}</p>`;
        }).join('');
        
        productionHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-egg"></i> Produção
                </h3>
                ${productionItems}
            </div>
        `;
    }
    
    // Held Items
    let heldItemsHTML = '';
    if (pokemon.held_items && pokemon.held_items.length > 0) {
        const heldItemsList = pokemon.held_items.map(hi => {
            const item = items.find(i => i.id === hi.item_id || i.name === hi.item_name);
            return item ? `
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--dark3); border-radius: 6px; cursor: pointer;" onclick="openItemModal(${item.id})">
                    <img src="${item.sprite}" style="width: 32px; height: 32px;">
                    <div>
                        <div style="font-weight: 700;">${item.name}</div>
                        <div style="font-size: 12px; color: var(--white1);">Drop: ${hi.rarity}%</div>
                    </div>
                </div>
            ` : '';
        }).join('');
        
        heldItemsHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-gift"></i> Held Items
                </h3>
                ${heldItemsList}
            </div>
        `;
    }
    
    // Evolution Chain
    let evolutionHTML = '<p>Não evolui</p>';
    if (pokemon.evolution_chain && pokemon.evolution_chain.length > 0) {
        evolutionHTML = '<div class="moves-list">' + pokemon.evolution_chain.sort((a, b) => a.stage - b.stage).map(evo => {
            const evoPokemon = allPokemon.find(p => p.name.toLowerCase() === evo.pokemon.toLowerCase());
            const evoImage = evoPokemon ? `<img src="${evoPokemon.artwork}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 8px;">` : '';
            
            return `
                <div class="info-item" style="flex-direction: column; align-items: center; padding: 15px;">
                    ${evoImage}
                    <span class="info-label">Stage ${evo.stage}: ${evo.pokemon}</span>
                    ${evo.evolutions.map(e => {
                        let methodHTML = `→ ${e.to} (${e.method}`;
                        
                        if (e.method === 'item') {
                            const evoItem = items.find(i => i.name.toLowerCase() === e.condition.toLowerCase());
                            if (evoItem) {
                                methodHTML = `→ ${e.to} (<img src="${evoItem.sprite}" style="width: 20px; height: 20px; vertical-align: middle;" onclick="openItemModal(${evoItem.id})"> ${e.condition})`;
                            } else {
                                methodHTML += `: ${e.condition})`;
                            }
                        } else if (e.method === 'custom') {
                            methodHTML = `→ ${e.to} (${e.condition})`;
                        } else {
                            methodHTML += `: ${e.condition})`;
                        }
                        
                        return `<div style="padding: 5px 0; font-size: 12px; color: var(--white1);">${methodHTML}</div>`;
                    }).join('')}
                </div>
            `;
        }).join('') + '</div>';
    }
    
    return `
        <div class="pokemon-detail-grid">
            <div class="pokemon-detail-image">
                <img src="${pokemon.artwork}" alt="${pokemon.name}">
            </div>
            <div class="pokemon-detail-info">
                <div class="info-item">
                    <span class="info-label">Tipos</span>
                    <span class="info-value">${typesHTML}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">BST</span>
                    <span class="info-value">${bst}</span>
                </div>
                ${speciesIdHTML}
                <div class="info-item">
                    <span class="info-label">Altura</span>
                    <span class="info-value">${pokemon.height}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Peso</span>
                    <span class="info-value">${pokemon.weight}kg</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Base XP</span>
                    <span class="info-value">${pokemon.base_experience}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Classificação</span>
                    <span class="info-value">${pokemon.classification}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-book"></i> Pokédex Entry
            </h3>
            <p>${pokemon.dex_entry}</p>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-chart-bar"></i> Stats
            </h3>
            ${statsHTML}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-star"></i> Habilidades
            </h3>
            <div class="info-item">
                <span class="info-label">Normal</span>
                <span class="info-value">${normalAbilities}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Hidden</span>
                <span class="info-value">${hiddenAbilities}</span>
            </div>
            ${exoticAbilities}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-dna"></i> Reprodução
            </h3>
            <div class="info-item">
                <span class="info-label">Egg Groups</span>
                <span class="info-value">${eggGroups}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Gender Ratio</span>
                <span class="info-value">${genderHTML}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Pode Reproduzir</span>
                <span class="info-value">${pokemon.can_breed ? 'Sim' : 'Não'}</span>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-fist-raised"></i> Moveset por Level
            </h3>
            ${movesetHTML}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-compact-disc"></i> Golpes Aprendíveis (TM/TR/Tutor)
            </h3>
            ${learnableMovesHTML}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-egg"></i> Egg Moves
            </h3>
            ${eggMovesHTML}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-map-marker-alt"></i> Localizações
            </h3>
            <div class="pokemon-badges">${locationsHTML}</div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-exchange-alt"></i> Cadeia Evolutiva
            </h3>
            ${evolutionHTML}
        </div>
        
        ${productionHTML}
        ${heldItemsHTML}
    `;
}
// ==================== PARTE 4: RENDERIZAÇÃO DE ITENS E MOVES ====================

// ==================== ITEMDEX ====================

/**
 * Renderiza o grid de itens com paginação
 */
async function renderItemGrid() {
    const grid = document.getElementById('item-grid');
    const resultsInfo = document.getElementById('item-results-info');
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Carregando itens...</p></div>';
    
    const items = await loadData('items');
    const filtered = filterItems(items);
    
    // Calcula paginação
    const { currentPage, perPage } = PAGINATION.items;
    const totalPages = Math.ceil(filtered.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    // Atualiza info de resultados
    resultsInfo.innerHTML = `
        <span>Mostrando ${startIndex + 1}-${Math.min(endIndex, filtered.length)} de ${filtered.length} itens</span>
    `;
    
    // Renderiza cards
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="empty-state-text">Nenhum item encontrado</p>
                <p>Tente ajustar os filtros</p>
            </div>
        `;
        document.getElementById('item-pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = paginatedData.map(item => createItemCard(item)).join('');
    
    // Renderiza paginação
    renderPagination('items', totalPages, currentPage);
}

/**
 * Cria um card de item
 */
function createItemCard(item) {
    const badges = [];
    if (item.is_craftable) badges.push('<span class="info-badge" style="background: #3498db;">CRAFT</span>');
    if (item.forageable) badges.push('<span class="info-badge" style="background: #2ecc71;">COLETAR</span>');
    if (item.is_book) badges.push('<span class="info-badge" style="background: #9b59b6;">LIVRO</span>');
    if (item.is_unique) badges.push('<span class="info-badge" style="background: #e74c3c;">ÚNICO</span>');
    
    const rarity = item.rarity || 'comum';
    badges.push(`<span class="info-badge rarity-${rarity}">${rarity.toUpperCase()}</span>`);
    
    // Preço
    let priceHTML = '';
    if (item.price) {
        if (item.price.buy) priceHTML = `<div class="item-price" style="color: var(--accent1);">Compra: ${item.price.buy}₽</div>`;
        else if (item.price.sell) priceHTML = `<div class="item-price" style="color: var(--accent1);">Venda: ${item.price.sell}₽</div>`;
        else if (item.price.casino) priceHTML = `<div class="item-price" style="color: var(--accent1);">Casino: ${item.price.casino} chips</div>`;
        else if (item.price.mile) priceHTML = `<div class="item-price" style="color: var(--accent1);">Miles: ${item.price.mile}</div>`;
    }
    
    return `
        <div class="item-card" onclick="openItemModal(${item.id})">
            <div class="item-card-image">
                <img src="${item.sprite}" alt="${item.name}" loading="lazy">
            </div>
            <div class="pokemon-card-id">#${String(item.id).padStart(4, '0')}</div>
            <div class="item-card-name">${item.name}</div>
            <div class="item-category">
                <span class="info-badge" style="background: #6c757d;">${translateItemCategory(item.category)}</span>
                ${item.subcategory ? `<span class="info-badge" style="background: #95a5a6;">${item.subcategory}</span>` : ''}
            </div>
            <div class="pokemon-badges">
                ${badges.join('')}
            </div>
            ${priceHTML}
        </div>
    `;
}

/**
 * Abre modal com detalhes do item
 */
async function openItemModal(itemId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const item = DATA_CACHE.items.find(i => i.id === itemId);
    if (!item) return;
    
    const items = DATA_CACHE.items;
    const pokemon = DATA_CACHE.pokemon;
    const moves = DATA_CACHE.moves;
    const maps = DATA_CACHE.maps;
    const objects = DATA_CACHE.objects;
    
    modalTitle.innerHTML = `
        <img src="${item.sprite}" style="width: 60px; height: 60px; object-fit: contain;">
        #${String(item.id).padStart(4, '0')} - ${item.name}
    `;
    
    // Preços
    const pricesHTML = [];
    if (item.price.buy) pricesHTML.push(`<div class="info-item-vertical"><span class="info-label">Compra</span><span class="info-value">${item.price.buy} ₽</span></div>`);
    if (item.price.sell) pricesHTML.push(`<div class="info-item-vertical"><span class="info-label">Venda</span><span class="info-value">${item.price.sell} ₽</span></div>`);
    if (item.price.casino) pricesHTML.push(`<div class="info-item-vertical"><span class="info-label">Casino</span><span class="info-value">${item.price.casino} chips</span></div>`);
    if (item.price.mile) pricesHTML.push(`<div class="info-item-vertical"><span class="info-label">Miles</span><span class="info-value">${item.price.mile} miles</span></div>`);
    
    // TM info
    let tmHTML = '';
    if (item.category === 'tm' && item.linked_move) {
        const move = moves.find(m => m.id === item.linked_move);
        if (move) {
            tmHTML = `
                <div class="modal-section">
                    <h3 class="modal-section-title">
                        <i class="fas fa-info-circle"></i> Golpe Vinculado
                    </h3>
                    <div class="info-grid">
                        <div class="info-item-vertical">
                            <span class="info-label">Tipo</span>
                            <span class="info-value"><span class="type-badge type-${move.type.toLowerCase()}">${move.type}</span></span>
                        </div>
                        <div class="info-item-vertical">
                            <span class="info-label">Categoria</span>
                            <span class="info-value">${move.category}</span>
                        </div>
                        <div class="info-item-vertical">
                            <span class="info-label">Poder</span>
                            <span class="info-value">${move.power || '-'}</span>
                        </div>
                        <div class="info-item-vertical">
                            <span class="info-label">Precisão</span>
                            <span class="info-value">${move.accuracy || '-'}</span>
                        </div>
                        <div class="info-item-vertical">
                            <span class="info-label">PP</span>
                            <span class="info-value">${move.pp}</span>
                        </div>
                    </div>
                    <p style="margin-top: 10px;">${move.description}</p>
                </div>
            `;
        }
    }
    
    // Pokébola info (capture rate)
    let pokeballHTML = '';
    if (item.category === 'pokeball' && item.capture_rate) {
        pokeballHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-bullseye"></i> Taxa de Captura
                </h3>
                <div class="info-item">
                    <span class="info-label">Multiplicador</span>
                    <span class="info-value">${item.capture_rate}x</span>
                </div>
            </div>
        `;
    }
    
    // Evolution Item info
    let evolutionHTML = '';
    if (item.category === 'evolution-item' && item.linked_pokemon) {
        const linkedPokemon = item.linked_pokemon.map(pid => {
            const p = pokemon.find(pk => pk.id === pid);
            return p ? `
                <div class="spawn-pokemon-card" onclick="openPokemonModal(${p.id})">
                    <div class="spawn-pokemon-image">
                        <img src="${p.artwork}">
                    </div>
                    <div class="spawn-pokemon-name">${p.name}</div>
                </div>
            ` : '';
        }).join('');
        
        evolutionHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-exchange-alt"></i> Pokémon que Evoluem
                </h3>
                <div class="spawns-grid">
                    ${linkedPokemon}
                </div>
            </div>
        `;
    }
    
    // Book info
    let bookHTML = '';
    if (item.is_book && item.unlocks_recipes) {
        const recipes = item.unlocks_recipes.map(rid => {
            const recipeItem = items.find(i => i.id === rid);
            return recipeItem ? `
                <div class="map-item-card" onclick="openItemModal(${recipeItem.id})">
                    <div class="map-item-image">
                        <img src="${recipeItem.sprite}">
                    </div>
                    <div class="map-item-info">
                        <div class="map-item-name">${recipeItem.name}</div>
                    </div>
                </div>
            ` : '';
        }).join('');
        
        bookHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-book"></i> Receitas Desbloqueadas
                </h3>
                <div class="info-item">
                    <span class="info-label">Categoria</span>
                    <span class="info-value">${item.book_category || 'N/A'}</span>
                </div>
                <div class="items-grid" style="margin-top: 15px;">
                    ${recipes}
                </div>
            </div>
        `;
    }
    
    // Craft Recipe
    let craftHTML = '';
    if (item.is_craftable && item.craft_recipe && item.craft_recipe.length > 0) {
        const ingredients = item.craft_recipe.map(ing => {
            const ingredient = items.find(i => i.id === ing.item_id);
            return ingredient ? `
                <div class="map-item-card" onclick="openItemModal(${ingredient.id})">
                    <div class="map-item-image">
                        <img src="${ingredient.sprite}">
                    </div>
                    <div class="map-item-info">
                        <div class="map-item-name">${ingredient.name}</div>
                        <div class="map-item-details">Quantidade: ${ing.quantity}</div>
                    </div>
                </div>
            ` : '';
        }).join('');
        
        craftHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-hammer"></i> Receita de Craft
                </h3>
                <div class="items-grid">
                    ${ingredients}
                </div>
            </div>
        `;
    }
    
    // Onde encontrar
    let locationsHTML = '';
    const foundInMaps = maps.filter(map => 
        map.forageable_items && map.forageable_items.some(f => f.item_id === item.id)
    );
    const foundInObjects = objects.filter(obj => {
        if (!obj.loot) return false;
        if (obj.loot.common && obj.loot.common.some(l => l.item_id === item.id)) return true;
        if (obj.loot.rare && obj.loot.rare.some(l => l.item_id === item.id)) return true;
        if (obj.loot.epic && obj.loot.epic.some(l => l.item_id === item.id)) return true;
        return false;
    });
    
    if (foundInMaps.length > 0 || foundInObjects.length > 0) {
        const mapsHTML = foundInMaps.map(m => 
            `<div class="info-badge" style="cursor: pointer;" onclick="openMapModal('${m.id}')">${m.name}</div>`
        ).join('');
        const objectsHTML = foundInObjects.map(o => 
            `<div class="info-badge" style="background: #2ecc71; cursor: pointer;" onclick="openObjectModal('${o.id}')">${o.name}</div>`
        ).join('');
        
        locationsHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-map-marker-alt"></i> Onde Encontrar
                </h3>
                <div class="pokemon-badges">
                    ${mapsHTML}
                    ${objectsHTML}
                </div>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-info-circle"></i> Informações
            </h3>
            <div class="info-grid">
                <div class="info-item-vertical">
                    <span class="info-label">Categoria</span>
                    <span class="info-value">${translateItemCategory(item.category)}</span>
                </div>
                ${item.subcategory ? `
                <div class="info-item-vertical">
                    <span class="info-label">Subcategoria</span>
                    <span class="info-value">${item.subcategory}</span>
                </div>
                ` : ''}
                <div class="info-item-vertical">
                    <span class="info-label">Raridade</span>
                    <span class="info-value"><span class="info-badge rarity-${item.rarity || 'comum'}">${(item.rarity || 'comum').toUpperCase()}</span></span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Único</span>
                    <span class="info-value">${item.is_unique ? 'Sim' : 'Não'}</span>
                </div>
                ${item.forageable ? `
                <div class="info-item-vertical">
                    <span class="info-label">Posts para Coletar</span>
                    <span class="info-value">${item.posts_to_collect}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-align-left"></i> Descrição
            </h3>
            <p>${item.description}</p>
        </div>
        
        ${pricesHTML.length > 0 ? `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-coins"></i> Preços
            </h3>
            <div class="info-grid">
                ${pricesHTML.join('')}
            </div>
        </div>
        ` : ''}
        
        ${tmHTML}
        ${pokeballHTML}
        ${evolutionHTML}
        ${bookHTML}
        ${craftHTML}
        ${locationsHTML}
    `;
    
    modal.classList.add('active');
}

// ==================== MOVEDEX ====================

/**
 * Renderiza grid de moves com paginação
 */
async function renderMoveGrid() {
    const grid = document.getElementById('move-grid');
    const resultsInfo = document.getElementById('move-results-info');
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Carregando golpes...</p></div>';
    
    const moves = await loadData('moves');
    const filtered = filterMoves(moves);
    
    // Calcula paginação
    const { currentPage, perPage } = PAGINATION.moves;
    const totalPages = Math.ceil(filtered.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    // Atualiza info de resultados
    resultsInfo.innerHTML = `
        <span>Mostrando ${startIndex + 1}-${Math.min(endIndex, filtered.length)} de ${filtered.length} golpes</span>
    `;
    
    // Renderiza cards
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="empty-state-text">Nenhum golpe encontrado</p>
            </div>
        `;
        document.getElementById('move-pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = paginatedData.map(move => createMoveCard(move)).join('');
    
    // Renderiza paginação
    renderPagination('moves', totalPages, currentPage);
}

/**
 * Cria card de move
 */
function createMoveCard(move) {
    const badges = [];
    if (move.modified_for_rpg) badges.push('<span class="info-badge" style="background: #e74c3c;">MODIFICADO</span>');
    badges.push(`<span class="info-badge" style="background: #3498db;">${move.move_class.toUpperCase()}</span>`);
    
    return `
        <div class="pokemon-card" onclick="openMoveModal(${move.id})">
            <div class="pokemon-card-name">${capitalizeWords(move.name)}</div>
            <div class="pokemon-types">
                <span class="type-badge type-${move.type.toLowerCase()}">${move.type}</span>
            </div>
            <div class="pokemon-badges">${badges.join('')}</div>
            <div class="pokemon-stats">
                ${move.category} | Poder: ${move.power || '-'} | Prec: ${move.accuracy || '-'}
            </div>
        </div>
    `;
}

/**
 * Abre modal de move
 */
async function openMoveModal(moveId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const move = DATA_CACHE.moves.find(m => m.id === moveId);
    if (!move) return;
    
    const pokemon = DATA_CACHE.pokemon;
    
    modalTitle.innerHTML = `
        <i class="fas fa-fist-raised"></i> ${capitalizeWords(move.name)}
    `;
    
    // Encontrar Pokémon que aprendem (TODOS, sem limite)
    const learnedBy = pokemon.filter(p => 
        (p.moveset_by_level && p.moveset_by_level.some(m => m.move.toLowerCase() === move.name.toLowerCase())) ||
        (p.learnable_moves && p.learnable_moves.some(m => m.toLowerCase() === move.name.toLowerCase())) ||
        (p.egg_moves && p.egg_moves.some(m => m.toLowerCase() === move.name.toLowerCase()))
    );
    
    const firstPokemon = learnedBy.slice(0, 30);
    const remainingPokemon = learnedBy.slice(30);
    
    const pokemonHTML = firstPokemon.map(p => `
        <div class="pokemon-mini-card" onclick="openPokemonModal(${p.id})">
            <div class="pokemon-mini-image">
                <img src="${p.artwork}">
            </div>
            <div class="pokemon-mini-name">${p.name}</div>
        </div>
    `).join('');
    
    let remainingHTML = '';
    if (remainingPokemon.length > 0) {
        const allRemainingHTML = remainingPokemon.map(p => `
            <div class="pokemon-mini-card" onclick="openPokemonModal(${p.id})">
                <div class="pokemon-mini-image">
                    <img src="${p.artwork}">
                </div>
                <div class="pokemon-mini-name">${p.name}</div>
            </div>
        `).join('');
        
        remainingHTML = createSpoiler(
            `Ver mais ${remainingPokemon.length} Pokémon`,
            `<div class="pokemon-list-grid">${allRemainingHTML}</div>`
        );
    }
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-info-circle"></i> Informações
            </h3>
            <div class="info-grid">
                <div class="info-item-vertical">
                    <span class="info-label">Tipo</span>
                    <span class="info-value"><span class="type-badge type-${move.type.toLowerCase()}">${move.type}</span></span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Categoria</span>
                    <span class="info-value">${move.category}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Poder</span>
                    <span class="info-value">${move.power || '-'}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Precisão</span>
                    <span class="info-value">${move.accuracy || '-'}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">PP</span>
                    <span class="info-value">${move.pp}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Prioridade</span>
                    <span class="info-value">${move.priority}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Classe</span>
                    <span class="info-value">${move.move_class}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-align-left"></i> Descrição
            </h3>
            <p>${move.description}</p>
        </div>
        
        ${move.effect ? `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-magic"></i> Efeito
            </h3>
            <p>${move.effect}</p>
        </div>
        ` : ''}
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-dragon"></i> Pokémon que Aprendem (${learnedBy.length})
            </h3>
            <div class="pokemon-list-grid">
                ${pokemonHTML}
            </div>
            ${remainingHTML}
        </div>
    `;
    
    modal.classList.add('active');
}
// ==================== PARTE 5: RENDERIZAÇÃO DE ABILITIES E OBJETOS ====================

// ==================== ABILITYDEX ====================

/**
 * Renderiza grid de abilities com paginação
 */
async function renderAbilityGrid() {
    const grid = document.getElementById('ability-grid');
    const resultsInfo = document.getElementById('ability-results-info');
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Carregando habilidades...</p></div>';
    
    const abilities = await loadData('abilities');
    const filtered = filterAbilities(abilities);
    
    // Calcula paginação
    const { currentPage, perPage } = PAGINATION.abilities;
    const totalPages = Math.ceil(filtered.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    // Atualiza info de resultados
    resultsInfo.innerHTML = `
        <span>Mostrando ${startIndex + 1}-${Math.min(endIndex, filtered.length)} de ${filtered.length} habilidades</span>
    `;
    
    // Renderiza cards
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="empty-state-text">Nenhuma habilidade encontrada</p>
            </div>
        `;
        document.getElementById('ability-pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = paginatedData.map(ability => createAbilityCard(ability)).join('');
    
    // Renderiza paginação
    renderPagination('abilities', totalPages, currentPage);
}

/**
 * Cria card de ability
 */
function createAbilityCard(ability) {
    const badge = ability.modified_for_rpg 
        ? '<span class="info-badge" style="background: #e74c3c;">MODIFICADO</span>'
        : '<span class="info-badge" style="background: #95a5a6;">ORIGINAL</span>';
    
    return `
        <div class="pokemon-card" onclick="openAbilityModal(${ability.id})">
            <div class="pokemon-card-name">${capitalizeWords(ability.name)}</div>
            <div class="pokemon-badges">${badge}</div>
            <div class="pokemon-stats" style="font-size: 12px; text-align: left; height: 60px; overflow: hidden;">
                ${ability.effect.substring(0, 100)}...
            </div>
        </div>
    `;
}

/**
 * Abre modal de ability
 */
async function openAbilityModal(abilityId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const ability = DATA_CACHE.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    
    const pokemon = DATA_CACHE.pokemon;
    
    modalTitle.innerHTML = `
        <i class="fas fa-star"></i> ${capitalizeWords(ability.name)}
    `;
    
    // Encontrar Pokémon com essa ability (normal ou hidden)
    const withAbility = pokemon.filter(p => {
        const normal = Array.isArray(p.abilities.normal) 
            ? p.abilities.normal 
            : [p.abilities.normal];
        
        const hidden = Array.isArray(p.abilities.hidden)
            ? p.abilities.hidden
            : p.abilities.hidden ? [p.abilities.hidden] : [];
        
        const exotic = p.abilities.exotic || [];
        
        return normal.includes(ability.name) || 
               hidden.includes(ability.name) || 
               exotic.includes(ability.name);
    });
    
    const firstPokemon = withAbility.slice(0, 30);
    const remainingPokemon = withAbility.slice(30);
    
    const pokemonHTML = firstPokemon.map(p => {
        const normal = Array.isArray(p.abilities.normal) 
            ? p.abilities.normal 
            : [p.abilities.normal];
        const hidden = Array.isArray(p.abilities.hidden)
            ? p.abilities.hidden
            : p.abilities.hidden ? [p.abilities.hidden] : [];
        const exotic = p.abilities.exotic || [];
        
        const isHidden = hidden.includes(ability.name);
        const isExotic = exotic.includes(ability.name);
        
        let badge = '';
        if (isExotic) badge = '<span class="info-badge" style="background: #9b59b6;">EXÓTICA</span>';
        else if (isHidden) badge = '<span class="info-badge hidden">HIDDEN</span>';
        
        return `
            <div class="pokemon-mini-card" onclick="openPokemonModal(${p.id})">
                <div class="pokemon-mini-image">
                    <img src="${p.artwork}">
                </div>
                <div class="pokemon-mini-name">${p.name}</div>
                ${badge}
            </div>
        `;
    }).join('');
    
    let remainingHTML = '';
    if (remainingPokemon.length > 0) {
        const allRemainingHTML = remainingPokemon.map(p => {
            const normal = Array.isArray(p.abilities.normal) 
                ? p.abilities.normal 
                : [p.abilities.normal];
            const hidden = Array.isArray(p.abilities.hidden)
                ? p.abilities.hidden
                : p.abilities.hidden ? [p.abilities.hidden] : [];
            const exotic = p.abilities.exotic || [];
            
            const isHidden = hidden.includes(ability.name);
            const isExotic = exotic.includes(ability.name);
            
            let badge = '';
            if (isExotic) badge = '<span class="info-badge" style="background: #9b59b6;">EXÓTICA</span>';
            else if (isHidden) badge = '<span class="info-badge hidden">HIDDEN</span>';
            
            return `
                <div class="pokemon-mini-card" onclick="openPokemonModal(${p.id})">
                    <div class="pokemon-mini-image">
                        <img src="${p.artwork}">
                    </div>
                    <div class="pokemon-mini-name">${p.name}</div>
                    ${badge}
                </div>
            `;
        }).join('');
        
        remainingHTML = createSpoiler(
            `Ver mais ${remainingPokemon.length} Pokémon`,
            `<div class="pokemon-list-grid">${allRemainingHTML}</div>`
        );
    }
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-info-circle"></i> Status
            </h3>
            <div class="info-item">
                <span class="info-label">Modificado para RPG</span>
                <span class="info-value">${ability.modified_for_rpg ? 'Sim' : 'Não'}</span>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-magic"></i> Efeito
            </h3>
            <p>${ability.effect}</p>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-dragon"></i> Pokémon com esta Habilidade (${withAbility.length})
            </h3>
            <div class="pokemon-list-grid">
                ${pokemonHTML}
            </div>
            ${remainingHTML}
        </div>
    `;
    
    modal.classList.add('active');
}

// ==================== OBJETOS ====================

/**
 * Renderiza grid de objetos com paginação
 */
async function renderObjectGrid() {
    const grid = document.getElementById('object-grid');
    const resultsInfo = document.getElementById('object-results-info');
    
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Carregando objetos...</p></div>';
    
    const objects = await loadData('objects');
    const filtered = filterObjects(objects);
    
    // Calcula paginação
    const { currentPage, perPage } = PAGINATION.objects;
    const totalPages = Math.ceil(filtered.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    // Atualiza info de resultados
    resultsInfo.innerHTML = `
        <span>Mostrando ${startIndex + 1}-${Math.min(endIndex, filtered.length)} de ${filtered.length} objetos</span>
    `;
    
    // Renderiza cards
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="empty-state-text">Nenhum objeto encontrado</p>
            </div>
        `;
        document.getElementById('object-pagination').innerHTML = '';
        return;
    }
    
    grid.innerHTML = paginatedData.map(obj => createObjectCard(obj)).join('');
    
    // Renderiza paginação
    renderPagination('objects', totalPages, currentPage);
}

/**
 * Cria card de objeto
 */
function createObjectCard(obj) {
    return `
        <div class="object-card" onclick="openObjectModal('${obj.id}')">
            <div class="object-card-header">
                <span class="object-card-id">${obj.id}</span>
            </div>
            <div class="object-card-name">${obj.name}</div>
            <div class="object-card-type">${translateObjectType(obj.type)}</div>
            <div class="object-card-description">${obj.description.substring(0, 80)}...</div>
        </div>
    `;
}

/**
 * Abre modal de objeto
 */
async function openObjectModal(objectId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const object = DATA_CACHE.objects.find(o => o.id === objectId);
    if (!object) return;
    
    const pokemon = DATA_CACHE.pokemon;
    const items = DATA_CACHE.items;
    
    modalTitle.innerHTML = `
        <i class="fas fa-cube"></i> ${object.name}
    `;
    
    // Informações básicas
    let infoHTML = `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-info-circle"></i> Informações
            </h3>
            <div class="info-grid">
                <div class="info-item-vertical">
                    <span class="info-label">ID</span>
                    <span class="info-value">${object.id}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Tipo</span>
                    <span class="info-value">${translateObjectType(object.type)}</span>
                </div>
                ${object.cooldown_hours ? `
                <div class="info-item-vertical">
                    <span class="info-label">Cooldown</span>
                    <span class="info-value">${object.cooldown_hours}h</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-align-left"></i> Descrição
            </h3>
            <p>${object.description}</p>
        </div>
    `;
    
    // Loot (para árvores, pesca, etc)
    let lootHTML = '';
    
    if (object.loot) {
        // Berry Tree / Apricorn Tree (itens com raridade)
        if (object.type === 'berry_tree' || object.type === 'apricorn_tree') {
            const rarities = ['common', 'rare', 'epic'];
            const lootSections = rarities.map(rarity => {
                if (!object.loot[rarity] || object.loot[rarity].length === 0) return '';
                
                const itemsList = object.loot[rarity].map(entry => {
                    const item = items.find(i => i.id === entry.item_id);
                    return item ? `
                        <div class="map-item-card" onclick="openItemModal(${item.id})">
                            <div class="map-item-image">
                                <img src="${item.sprite}">
                            </div>
                            <div class="map-item-info">
                                <div class="map-item-name">${item.name}</div>
                                <div class="map-item-details">Taxa: ${entry.rate}%</div>
                            </div>
                        </div>
                    ` : '';
                }).join('');
                
                return `
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: var(--accent1); margin-bottom: 10px; text-transform: uppercase; font-size: 14px;">${rarity}</h4>
                        <div class="items-grid">
                            ${itemsList}
                        </div>
                    </div>
                `;
            }).filter(Boolean).join('');
            
            if (lootSections) {
                lootHTML = `
                    <div class="modal-section">
                        <h3 class="modal-section-title">
                            <i class="fas fa-gift"></i> Loot
                        </h3>
                        ${lootSections}
                    </div>
                `;
            }
        }
        
        // Fishing Spot (Pokémon + Itens)
        if (object.type === 'fishing_spot') {
            const rarities = ['common', 'rare', 'epic'];
            
            // Pokémon
            const pokemonSections = rarities.map(rarity => {
                if (!object.loot[rarity] || object.loot[rarity].length === 0) return '';
                
                const pokemonList = object.loot[rarity].map(entry => {
                    const pkmn = pokemon.find(p => p.id === entry.pokemon_id);
                    return pkmn ? `
                        <div class="spawn-pokemon-card" onclick="openPokemonModal(${pkmn.id})">
                            <div class="spawn-pokemon-image">
                                <img src="${pkmn.artwork}">
                            </div>
                            <div class="spawn-pokemon-name">${pkmn.name}</div>
                            <div style="font-size: 11px; color: var(--white2); margin-top: 4px;">Taxa: ${entry.rate}%</div>
                        </div>
                    ` : '';
                }).join('');
                
                return `
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: var(--accent1); margin-bottom: 10px; text-transform: uppercase; font-size: 14px;">${rarity}</h4>
                        <div class="spawns-grid">
                            ${pokemonList}
                        </div>
                    </div>
                `;
            }).filter(Boolean).join('');
            
            // Itens
            const itemsSections = rarities.map(rarity => {
                if (!object.loot.items || !object.loot.items[rarity] || object.loot.items[rarity].length === 0) return '';
                
                const itemsList = object.loot.items[rarity].map(entry => {
                    const item = items.find(i => i.id === entry.item_id);
                    return item ? `
                        <div class="map-item-card" onclick="openItemModal(${item.id})">
                            <div class="map-item-image">
                                <img src="${item.sprite}">
                            </div>
                            <div class="map-item-info">
                                <div class="map-item-name">${item.name}</div>
                                <div class="map-item-details">Taxa: ${entry.rate}%</div>
                            </div>
                        </div>
                    ` : '';
                }).join('');
                
                return `
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: var(--accent1); margin-bottom: 10px; text-transform: uppercase; font-size: 14px;">${rarity}</h4>
                        <div class="items-grid">
                            ${itemsList}
                        </div>
                    </div>
                `;
            }).filter(Boolean).join('');
            
            if (pokemonSections || itemsSections) {
                lootHTML = `
                    ${pokemonSections ? `
                    <div class="modal-section">
                        <h3 class="modal-section-title">
                            <i class="fas fa-dragon"></i> Pokémon
                        </h3>
                        ${pokemonSections}
                    </div>
                    ` : ''}
                    
                    ${itemsSections ? `
                    <div class="modal-section">
                        <h3 class="modal-section-title">
                            <i class="fas fa-gift"></i> Itens
                        </h3>
                        ${itemsSections}
                    </div>
                    ` : ''}
                `;
            }
        }
        
        // Evolution Stone / Evolution Location / Social Spot (Pokémon vinculados)
        if (object.loot.linked_pokemon && object.loot.linked_pokemon.length > 0) {
            const linkedPokemon = object.loot.linked_pokemon.map(pid => {
                const pkmn = pokemon.find(p => p.id === pid);
                return pkmn ? `
                    <div class="spawn-pokemon-card" onclick="openPokemonModal(${pkmn.id})">
                        <div class="spawn-pokemon-image">
                            <img src="${pkmn.artwork}">
                        </div>
                        <div class="spawn-pokemon-name">${pkmn.name}</div>
                    </div>
                ` : '';
            }).join('');
            
            lootHTML = `
                <div class="modal-section">
                    <h3 class="modal-section-title">
                        <i class="fas fa-dragon"></i> Pokémon Vinculados
                    </h3>
                    <div class="spawns-grid">
                        ${linkedPokemon}
                    </div>
                </div>
            `;
        }
    }
    
    // Linked Pokémon (fora do loot)
    let linkedPokemonHTML = '';
    if (object.linked_pokemon && object.linked_pokemon.length > 0) {
        const linkedPkmn = object.linked_pokemon.map(pid => {
            const pkmn = pokemon.find(p => p.id === pid);
            return pkmn ? `
                <div class="spawn-pokemon-card" onclick="openPokemonModal(${pkmn.id})">
                    <div class="spawn-pokemon-image">
                        <img src="${pkmn.artwork}">
                    </div>
                    <div class="spawn-pokemon-name">${pkmn.name}</div>
                </div>
            ` : '';
        }).join('');
        
        linkedPokemonHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-link"></i> Pokémon Relacionados
                </h3>
                <div class="spawns-grid">
                    ${linkedPkmn}
                </div>
            </div>
        `;
    }
    
    // Narrative (se tiver)
    let narrativeHTML = '';
    if (object.narrative) {
        narrativeHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-book-open"></i> Narrativa
                </h3>
                <p style="font-style: italic; color: var(--white1);">${object.narrative}</p>
            </div>
        `;
    }
    
    modalBody.innerHTML = infoHTML + lootHTML + linkedPokemonHTML + narrativeHTML;
    
    modal.classList.add('active');
}

/**
 * Renderiza todas as lojas
 */
async function renderShops() {
    await renderCasinoShop();
    await renderMileShop();
    await renderBookShop();
    await renderTMShop();
    
    // Setup shop tabs navigation
    setupShopTabs();
}

/**
 * Renderiza Casino Shop
 */
async function renderCasinoShop() {
    const grid = document.getElementById('casino-grid');
    const items = await loadData('items');
    
    // Filtra apenas os itens configurados para esta loja
    const casinoItems = SHOP_ITEMS.casino
        .map(id => items.find(i => i.id === id))
        .filter(Boolean); // Remove itens não encontrados
    
    if (casinoItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p class="empty-state-text">Nenhum item configurado</p>
                <p>Adicione IDs de itens em SHOP_ITEMS.casino no JavaScript</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = casinoItems.map(item => 
        createShopItemCard(item, item.price.casino || 0, 'chips')
    ).join('');
}

/**
 * Renderiza Mile Shop
 */
async function renderMileShop() {
    const grid = document.getElementById('mile-grid');
    const items = await loadData('items');
    
    // Filtra apenas os itens configurados para esta loja
    const mileItems = SHOP_ITEMS.mile
        .map(id => items.find(i => i.id === id))
        .filter(Boolean);
    
    if (mileItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p class="empty-state-text">Nenhum item configurado</p>
                <p>Adicione IDs de itens em SHOP_ITEMS.mile no JavaScript</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = mileItems.map(item => 
        createShopItemCard(item, item.price.mile || 0, 'miles')
    ).join('');
}

/**
 * Renderiza Book Shop
 */
async function renderBookShop() {
    const grid = document.getElementById('book-grid');
    const items = await loadData('items');
    
    // Filtra apenas os itens configurados para esta loja
    const bookItems = SHOP_ITEMS.book
        .map(id => items.find(i => i.id === id))
        .filter(Boolean);
    
    if (bookItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p class="empty-state-text">Nenhum item configurado</p>
                <p>Adicione IDs de itens em SHOP_ITEMS.book no JavaScript</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = bookItems.map(item => 
        createShopItemCard(item, item.price.buy || 0, '₽')
    ).join('');
}

/**
 * Renderiza TM Shop
 */
async function renderTMShop() {
    const grid = document.getElementById('tm-grid');
    const items = await loadData('items');
    
    // Filtra apenas os itens configurados para esta loja
    const tmItems = SHOP_ITEMS.tm
        .map(id => items.find(i => i.id === id))
        .filter(Boolean);
    
    if (tmItems.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p class="empty-state-text">Nenhum item configurado</p>
                <p>Adicione IDs de itens em SHOP_ITEMS.tm no JavaScript</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tmItems.map(item => 
        createShopItemCard(item, item.price.buy || 0, '₽')
    ).join('');
}

/**
 * Cria card de item de loja
 */
function createShopItemCard(item, price, currency) {
    return `
        <div class="item-card" onclick="openItemModal(${item.id})">
            <div class="item-card-image">
                <img src="${item.sprite}" alt="${item.name}" loading="lazy">
            </div>
            <div class="pokemon-card-id">#${String(item.id).padStart(4, '0')}</div>
            <div class="item-card-name">${item.name}</div>
            <div class="item-category">
                <span class="info-badge" style="background: #6c757d;">${translateItemCategory(item.category)}</span>
            </div>
            <div class="item-price" style="font-size: 16px; font-weight: 700; color: var(--accent1); margin-top: 10px;">
                ${price} ${currency}
            </div>
        </div>
    `;
}

/**
 * Setup shop tabs navigation
 */
function setupShopTabs() {
    const shopTabs = document.querySelectorAll('.shop-tabs .nav-tab');
    shopTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            shopTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.shop-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetShop = tab.dataset.shop + '-shop';
            document.getElementById(targetShop).classList.add('active');
        });
    });
}
// ==================== PARTE 7: SISTEMA DE MAPAS ====================

/**
 * Renderiza sistema de mapas
 */
async function renderMaps() {
    await renderInteractiveMap();
    await renderMapCards();
    
    // Setup map tabs navigation
    setupMapTabs();
}

/**
 * Renderiza mapa interativo
 */
async function renderInteractiveMap() {
    const markersContainer = document.getElementById('map-markers');
    markersContainer.innerHTML = '';
    
    const maps = await loadData('maps');
    const visibleMaps = filterMaps(maps);
    
    visibleMaps.forEach(map => {
        const marker = document.createElement('div');
        marker.className = `map-marker ${map.type}`;
        marker.style.left = `${map.coordinates.x}%`;
        marker.style.top = `${map.coordinates.y}%`;
        
        if (map.type === 'route') {
            const routeNum = map.name.match(/\d+/);
            if (routeNum) marker.textContent = routeNum[0];
        }
        
        marker.addEventListener('click', () => openMapModal(map.id));
        
        markersContainer.appendChild(marker);
    });
}

/**
 * Renderiza cards de mapas
 */
async function renderMapCards() {
    const grid = document.getElementById('map-cards-grid');
    const maps = await loadData('maps');
    
    // Aplica filtros
    let filtered = filterMaps(maps);
    
    const typeFilter = document.getElementById('map-type').value;
    const biomeFilter = document.getElementById('map-biome').value;
    
    if (typeFilter) {
        filtered = filtered.filter(m => m.type === typeFilter);
    }
    
    if (biomeFilter) {
        filtered = filtered.filter(m => m.biome === biomeFilter);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p class="empty-state-text">Nenhum mapa encontrado</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(map => createMapCard(map)).join('');
}

/**
 * Cria card de mapa
 */
function createMapCard(map) {
    const mapImageStyle = map.map_image 
        ? `background-image: url('${map.map_image}');` 
        : 'background: var(--dark2);';
    
    return `
        <div class="map-card" onclick="openMapModal('${map.id}')">
            <div class="map-card-image" style="${mapImageStyle}"></div>
            <div class="map-card-content">
                <div class="map-card-name">${map.name}</div>
                <div class="map-card-info">
                    <div><strong>ID:</strong> ${map.id}</div>
                    <div><strong>Tipo:</strong> ${translateMapType(map.type)}</div>
                    <div><strong>Bioma:</strong> ${map.biome}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Abre modal de mapa
 */
async function openMapModal(mapId) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    const map = DATA_CACHE.maps.find(m => m.id === mapId);
    if (!map) return;
    
    const pokemon = DATA_CACHE.pokemon;
    const items = DATA_CACHE.items;
    const objects = DATA_CACHE.objects;
    
    modalTitle.innerHTML = `
        <i class="fas fa-map-marker-alt"></i> ${map.name}
    `;
    
    // Imagem do local
    const mapImageHTML = map.map_image ? `
        <img src="${map.map_image}" class="map-location-image" alt="${map.name}">
    ` : '';
    
    // Spawns com cards bonitos (estilo Pokémon Selvagem)
    const spawnsHTML = ['common', 'rare', 'epic'].map(rarity => {
        if (!map.spawns || !map.spawns[rarity] || map.spawns[rarity].length === 0) return '';
        
        const pokemonList = map.spawns[rarity].map(pid => {
            const p = pokemon.find(pk => pk.id === pid);
            if (!p) return '';
            
            const typesHTML = p.types.map(type => 
                `<span class="type-badge type-${type.toLowerCase()}">${type}</span>`
            ).join('');
            
            // Adiciona nome da forma se não for base
            let formName = p.name;
            if (!p.base_form && p.form_type) {
                const formTypes = {
                    'mega': 'Mega',
                    'gigantamax': 'G-Max',
                    'regional': 'Regional'
                };
                const formLabel = formTypes[p.form_type] || '';
                if (formLabel && !formName.includes(formLabel)) {
                    formName = `${formName} (${formLabel})`;
                }
            }
            
            return `
                <div class="spawn-pokemon-card" onclick="openPokemonModal(${p.id})">
                    <div class="spawn-pokemon-image">
                        <img src="${p.artwork}">
                    </div>
                    <div class="spawn-pokemon-name">${formName}</div>
                    <div class="spawn-pokemon-types">${typesHTML}</div>
                </div>
            `;
        }).join('');
        
        const rarityColors = {
            'common': '#95a5a6',
            'rare': '#f39c12',
            'epic': '#9b59b6'
        };
        
        return `
            <div style="margin-bottom: 20px;">
                <h4 style="color: ${rarityColors[rarity]}; margin-bottom: 10px; text-transform: uppercase; font-size: 14px; font-weight: 700;">
                    <i class="fas fa-star"></i> ${rarity === 'common' ? 'Comum' : rarity === 'rare' ? 'Raro' : 'Épico'}
                </h4>
                <div class="spawns-grid">
                    ${pokemonList}
                </div>
            </div>
        `;
    }).join('');
    
    // Forageable Items
    let forageableHTML = '';
    if (map.forageable_items && map.forageable_items.length > 0) {
        const itemsList = map.forageable_items.map(f => {
            const item = items.find(i => i.id === f.item_id);
            return item ? `
                <div class="map-item-card" onclick="openItemModal(${item.id})">
                    <div class="map-item-image">
                        <img src="${item.sprite}">
                    </div>
                    <div class="map-item-info">
                        <div class="map-item-name">${item.name}</div>
                        <div class="map-item-details">${f.posts_to_collect} posts para coletar</div>
                    </div>
                </div>
            ` : '';
        }).join('');
        
        forageableHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-leaf"></i> Itens Coletáveis
                </h3>
                <div class="items-grid">
                    ${itemsList}
                </div>
            </div>
        `;
    }
    
    // Interaction Objects (clicáveis)
    let objectsHTML = '';
    if (map.interaction_objects && map.interaction_objects.length > 0) {
        const objectsList = map.interaction_objects.map(objId => {
            const obj = objects.find(o => o.id === objId);
            return obj ? `
                <div class="info-badge" style="background: #2ecc71; cursor: pointer;" onclick="openObjectModal('${obj.id}')">
                    ${obj.name}
                </div>
            ` : '';
        }).join('');
        
        objectsHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-cube"></i> Objetos Interativos
                </h3>
                <div class="pokemon-badges">
                    ${objectsList}
                </div>
            </div>
        `;
    }
    
    // Points of Interest com melhor contraste
    let poisHTML = '';
    if (map.points_of_interest && map.points_of_interest.length > 0) {
        poisHTML = map.points_of_interest.map(poi => {
            let shopHTML = '';
            
            // Itens que o NPC vende
            if (poi.shop_data && poi.shop_data.sells) {
                const sellsItems = poi.shop_data.sells.map(itemId => {
                    const item = items.find(i => i.id === itemId);
                    return item ? `
                        <div class="map-item-card" onclick="openItemModal(${item.id})">
                            <div class="map-item-image">
                                <img src="${item.sprite}">
                            </div>
                            <div class="map-item-info">
                                <div class="map-item-name">${item.name}</div>
                                <div class="map-item-details">Preço: ${item.price.buy || '?'}₽</div>
                            </div>
                        </div>
                    ` : '';
                }).join('');
                
                shopHTML += `
                    <div style="margin-top: 15px;">
                        <strong style="color: var(--accent1); font-size: 13px;">Vende:</strong>
                        <div class="items-grid" style="margin-top: 10px;">
                            ${sellsItems}
                        </div>
                    </div>
                `;
            }
            
            // Itens que o NPC compra
            if (poi.shop_data && poi.shop_data.buys) {
                const buysItems = poi.shop_data.buys.map(buyData => {
                    const item = items.find(i => i.id === buyData.item_id);
                    return item ? `
                        <div class="map-item-card" onclick="openItemModal(${item.id})">
                            <div class="map-item-image">
                                <img src="${item.sprite}">
                            </div>
                            <div class="map-item-info">
                                <div class="map-item-name">${item.name}</div>
                                <div class="map-item-details">
                                    Compra por: ${buyData.price || item.price.sell || '?'}₽
                                    ${buyData.requires_fame ? ` | Requer ${buyData.requires_fame} de fama` : ''}
                                </div>
                            </div>
                        </div>
                    ` : '';
                }).join('');
                
                shopHTML += `
                    <div style="margin-top: 15px;">
                        <strong style="color: var(--accent1); font-size: 13px;">Compra:</strong>
                        <div class="items-grid" style="margin-top: 10px;">
                            ${buysItems}
                        </div>
                    </div>
                `;
            }
            
            // Custom (descrições especiais como acampamento)
            let customHTML = '';
            if (poi.custom) {
                customHTML = `
                    <div style="margin-top: 10px; padding: 10px; background: var(--dark2); border-radius: 6px; border-left: 3px solid var(--accent1);">
                        <strong style="color: var(--accent1);">Especial:</strong>
                        <p style="margin-top: 5px; font-size: 12px;">${poi.custom}</p>
                    </div>
                `;
            }
            
            return `
                <div style="background: var(--dark2); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--dark3);">
                    <h4 style="color: var(--white); background: var(--accent1); padding: 8px 12px; border-radius: 5px; margin-bottom: 10px; font-size: 15px;">
                        ${poi.name}
                    </h4>
                    <div style="font-size: 11px; color: var(--accent1); text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">
                        ${poi.type}
                    </div>
                    <p style="font-size: 13px; color: var(--white1); line-height: 1.5;">${poi.description}</p>
                    ${customHTML}
                    ${shopHTML}
                    ${poi.forum_link && poi.forum_link !== 'n/a' ? `
                        <a href="${poi.forum_link}" target="_blank" style="display: inline-block; margin-top: 10px; padding: 6px 12px; background: var(--accent1); color: var(--dark); border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600;">
                            <i class="fas fa-external-link-alt"></i> Ver no Fórum
                        </a>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        poisHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-landmark"></i> Pontos de Interesse
                </h3>
                ${poisHTML}
            </div>
        `;
    }
    
    // Accesses
    let accessesHTML = '';
    if (map.accesses) {
        const accessList = Object.entries(map.accesses).map(([direction, access]) => {
            const directionIcons = {
                north: 'fa-arrow-up',
                south: 'fa-arrow-down',
                east: 'fa-arrow-right',
                west: 'fa-arrow-left'
            };
            
            return `
                <div class="info-item">
                    <span class="info-label">
                        <i class="fas ${directionIcons[direction]}"></i> ${direction.toUpperCase()}
                    </span>
                    <span class="info-value">
                        ${access.name}
                        ${access.posts_required ? ` (${access.posts_required} posts)` : ''}
                    </span>
                </div>
            `;
        }).join('');
        
        accessesHTML = `
            <div class="modal-section">
                <h3 class="modal-section-title">
                    <i class="fas fa-road"></i> Acessos
                </h3>
                ${accessList}
            </div>
        `;
    }
    
    // Metadata adicional
    let metadataHTML = '';
    if (map.metadata) {
        const metaItems = [];
        if (map.metadata.population) {
            metaItems.push(`
                <div class="info-item-vertical">
                    <span class="info-label">População</span>
                    <span class="info-value">${map.metadata.population.toLocaleString('pt-BR')}</span>
                </div>
            `);
        }
        
        if (metaItems.length > 0) {
            metadataHTML = `
                <div class="modal-section">
                    <h3 class="modal-section-title">
                        <i class="fas fa-info-circle"></i> Metadados
                    </h3>
                    <div class="info-grid">
                        ${metaItems.join('')}
                    </div>
                </div>
            `;
        }
    }
    
    modalBody.innerHTML = `
        ${mapImageHTML}
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-info-circle"></i> Informações
            </h3>
            <div class="info-grid">
                <div class="info-item-vertical">
                    <span class="info-label">ID</span>
                    <span class="info-value">${map.id}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Tipo</span>
                    <span class="info-value">${translateMapType(map.type)}</span>
                </div>
                <div class="info-item-vertical">
                    <span class="info-label">Bioma</span>
                    <span class="info-value">${map.biome}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-align-left"></i> Descrição
            </h3>
            <p style="text-align: justify; white-space: pre-line;">${map.description}</p>
        </div>
        
        ${spawnsHTML ? `
        <div class="modal-section">
            <h3 class="modal-section-title">
                <i class="fas fa-dragon"></i> Pokémon Spawns
            </h3>
            ${spawnsHTML}
        </div>
        ` : ''}
        
        ${forageableHTML}
        ${objectsHTML}
        ${poisHTML}
        ${accessesHTML}
        ${metadataHTML}
    `;
    
    modal.classList.add('active');
}

/**
 * Setup map tabs navigation
 */
function setupMapTabs() {
    const mapTabs = document.querySelectorAll('.map-tabs .nav-tab');
    mapTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mapTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.map-view-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetView = 'map-' + tab.dataset.mapView;
            document.getElementById(targetView).classList.add('active');
        });
    });
}
// ==================== PARTE 8: PAGINAÇÃO E INICIALIZAÇÃO ====================

// ==================== SISTEMA DE PAGINAÇÃO ====================

/**
 * Renderiza controles de paginação
 */
function renderPagination(section, totalPages, currentPage) {
    const paginationContainer = document.getElementById(`${section}-pagination`);
    
    if (!paginationContainer) {
        console.warn(`Elemento ${section}-pagination não encontrado`);
        return;
    }
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${section}', ${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
    `;
    
    // Mostra primeira página
    if (currentPage > 3) {
        html += `<button onclick="changePage('${section}', 1)">1</button>`;
        if (currentPage > 4) html += `<span style="padding: 0 10px; color: var(--white2);">...</span>`;
    }
    
    // Mostra páginas ao redor da atual
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage('${section}', ${i})">${i}</button>`;
    }
    
    // Mostra última página
    if (currentPage < totalPages - 2) {
        if (currentPage < totalPages - 3) html += `<span style="padding: 0 10px; color: var(--white2);">...</span>`;
        html += `<button onclick="changePage('${section}', ${totalPages})">${totalPages}</button>`;
    }
    
    html += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${section}', ${currentPage + 1})">
            Próxima <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = html;
}

/**
 * Muda de página
 */
function changePage(section, page) {
    PAGINATION[section].currentPage = page;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Re-renderiza a seção
    switch(section) {
        case 'pokemon':
            renderPokemonGrid();
            break;
        case 'items':
            renderItemGrid();
            break;
        case 'moves':
            renderMoveGrid();
            break;
        case 'abilities':
            renderAbilityGrid();
            break;
        case 'objects':
            renderObjectGrid();
            break;
    }
}

// ==================== INICIALIZAÇÃO ====================

/**
 * Inicializa a aplicação
 */
async function init() {
    console.log('🚀 Iniciando Seira RPG Database...');
    
    try {
        // Carrega dados
        await initializeData();
        
        // Configura navegação
        setupNavigation();
        setupModal();
        setupFilters();
        
        // Renderiza primeira seção (Pokédex)
        await renderPokemonGrid();
        
        console.log('✅ Database carregado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
        
        // Mostra erro na tela
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                    <p class="empty-state-text">Erro ao carregar o Database</p>
                    <p>Por favor, recarregue a página ou contate o administrador.</p>
                    <p style="font-size: 12px; color: var(--white2); margin-top: 10px;">Erro: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== EXPORTS PARA DEBUGGING (OPCIONAL) ====================
// Descomente se precisar acessar as funções no console do navegador

// window.SeiraDB = {
//     DATA_CACHE,
//     FILTERS,
//     PAGINATION,
//     openPokemonModal,
//     openItemModal,
//     openMoveModal,
//     openAbilityModal,
//     openMapModal,
//     openObjectModal,
//     renderPokemonGrid,
//     renderItemGrid,
//     renderMoveGrid,
//     renderAbilityGrid,
//     renderMapCards,
//     renderObjectGrid
// };

console.log('%c🌿 Seira RPG Database carregado!', 'color: #7b9c4a; font-size: 16px; font-weight: bold;');
console.log('%cVersão: 1.0.0', 'color: #66843a;');

console.log('%cDesenvolvido para Seira RPG', 'color: #6a7530;');
