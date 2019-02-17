from collections import namedtuple

Representation = namedtuple('Representation', ['background', 'border', 'text', 'shape', 'highlight'])

REPRESENTATIONS = {
    'active': Representation(
        background='#dddddd',
        border='#bbbbbb',
        text='#000000',
        shape='box',
        highlight='#ee8866'
    ),
    'passive': Representation(
        background='#f1f1f1',
        border='#e3e3e3',
        text='#999999',
        shape='box',
        highlight='#f8cfc1'
    ),
    'active_theory_axiom': Representation(
        background='#77aadd',
        border='#4477aa',
        text='#000000',
        shape='box',
        highlight='#ee8866'
    ),
    'passive_theory_axiom': Representation(
        background='#c8ddf1',
        border='#b4c8dd',
        text='#999999',
        shape='box',
        highlight='#f8cfc1'
    ),
    'preprocessing': Representation(
        background='#44bb99',
        border='#009988',
        text='#000000',
        shape='box',
        highlight='#ee8866'
    ),
    'hidden': Representation(
        background='#ffffff00',
        border='#ffffff00',
        text='#ffffff00',
        shape='box',
        highlight='#ffffff00'
    )
}

PREPROCESSING_LABEL = 'Preproc'


def compute_representation(node, history_state, has_visible_children):
    if node.inference_rule == 'theory axiom':
        if node.active_time and node.active_time <= history_state:
            return REPRESENTATIONS['active_theory_axiom']
        elif node.passive_time and node.passive_time <= history_state:
            return REPRESENTATIONS['passive_theory_axiom']

    if node.active_time and node.active_time <= history_state:
        return REPRESENTATIONS['active']
    elif node.passive_time and node.passive_time <= history_state:
        return REPRESENTATIONS['passive']

    if node.inference_rule == 'Preproc' and has_visible_children:
        return REPRESENTATIONS['preprocessing']

    return REPRESENTATIONS['hidden']
