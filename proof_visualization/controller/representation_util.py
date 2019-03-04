from collections import namedtuple

Style = namedtuple('Style', ['background', 'border'])
Representation = namedtuple('Representation', ['default_style', 'text', 'shape', 'highlight_style', 'marked_style'])

REPRESENTATIONS = {
    'active': Representation(
        default_style=Style(background='#dddddd', border='#bbbbbb'),
        text='#000000',
        shape='box',
        highlight_style=Style(background='#ee8866', border='#ee8866'),
        marked_style=Style(background='#ffaabb', border='#ee3377')
    ),
    'passive': Representation(
        default_style=Style(background='#f1f1f1', border='#e3e3e3'),
        text='#999999',
        shape='box',
        highlight_style=Style(background='#f8cfc1', border='#f8cfc1'),
        marked_style=Style(background='#ffdde3', border='#f8adc8')
    ),
    'new': Representation(
        default_style=Style(background='#f8f8f8', border='#f1f1f1'),
        text='#999999',
        shape='box',
        highlight_style=Style(background='#f8cfc1', border='#f8cfc1'),
        marked_style=Style(background='#ffdde3', border='#f8adc8')
    ),
    'active_theory_axiom': Representation(
        default_style=Style(background='#77aadd', border='#4477aa'),
        text='#000000',
        shape='box',
        highlight_style=Style(background='#ee8866', border='#ee8866'),
        marked_style=Style(background='#ffaabb', border='#ee3377')
    ),
    'passive_theory_axiom': Representation(
        default_style=Style(background='#c8ddf1', border='#b4c8dd'),
        text='#999999',
        shape='box',
        highlight_style=Style(background='#f8cfc1', border='#f8cfc1'),
        marked_style=Style(background='#ffdde3', border='#f8adc8')
    ),
    'input': Representation(
        default_style=Style(background='#44bb99', border='#009988'),
        text='#000000',
        shape='box',
        highlight_style=Style(background='#ee8866', border='#ee8866'),
        marked_style=Style(background='#ffaabb', border='#ee3377')
    ),
    'preprocessing': Representation(
        default_style=Style(background='#abe0d1', border='#8cd1c9'),
        text='#000000',
        shape='box',
        highlight_style=Style(background='#ee8866', border='#ee8866'),
        marked_style=Style(background='#ffaabb', border='#ee3377')
    ),
    'hidden': Representation(
        default_style=Style(background='#ffffff00', border='#ffffff00'),
        text='#ffffff00',
        shape='box',
        highlight_style=Style(background='#ffffff00', border='#ffffff00'),
        marked_style=Style(background='#ffffff00', border='#ffffff00')
    )
}

LEGEND = [
    {
        'color': {
            'background': '#dddddd',
            'border': '#bbbbbb'
        },
        'font': {
            'color': '#000000'
        },
        'label': 'active',
        'shape': 'box',
        'x': -50,
        'y': -90
    },
    {
        'color': {
            'background': '#f1f1f1',
            'border': '#e3e3e3'
        },
        'font': {
            'color': '#999999'
        },
        'label': 'passive',
        'shape': 'box',
        'x': -45,
        'y': -54
    },
    {
        'color': {
            'background': '#44bb99',
            'border': '#009988'
        },
        'font': {
            'color': '#000000'
        },
        'label': 'preprocessing',
        'shape': 'box',
        'x': -25,
        'y': -18
    },
    {
        'color': {
            'background': '#77aadd',
            'border': '#4477aa'
        },
        'font': {
            'color': '#000000'
        },
        'label': 'active theory axiom',
        'shape': 'box',
        'x': -10,
        'y': 18
    },
    {
        'color': {
            'background': '#c8ddf1',
            'border': '#b4c8dd'
        },
        'font': {
            'color': '#999999'
        },
        'label': 'passive theory axiom',
        'shape': 'box',
        'x': -5,
        'y': 54
    },
    {
        'color': {
            'background': '#ee8866',
            'border': '#ee8866'
        },
        'font': {
            'multi': 'html',
            'color': '#000000'
        },
        'label': '<b>highlighted/selected</b>',
        'shape': 'box',
        'x': 0,
        'y': 90
    }
]

PREPROCESSING_LABEL = 'Preproc'


def compute_representation(node, history_state):
    if node.inference_rule == 'theory axiom':
        if node.active_time is not None and node.active_time <= history_state:
            return REPRESENTATIONS['active_theory_axiom']
        elif node.passive_time is not None and node.passive_time <= history_state:
            return REPRESENTATIONS['passive_theory_axiom']

    if node.is_from_preprocessing:
        return REPRESENTATIONS['preprocessing'] if node.parents else REPRESENTATIONS['input']

    if node.active_time is not None and node.active_time <= history_state:
        return REPRESENTATIONS['active']
    elif node.passive_time is not None and node.passive_time <= history_state:
        return REPRESENTATIONS['passive']
    elif node.new_time is not None and node.new_time < history_state:
        return REPRESENTATIONS['new']

    return REPRESENTATIONS['hidden']


def legend():
    return LEGEND
