import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';

import { getDependents, addDependent } from '../lib/api/dependents';

type Dependent = {
  id: number;
  name: string;
  relation: string;
};

export default function FamilyScreen() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadDependents() {
    try {
      const data = await getDependents();
      setDependents(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!name || !relation) return;

    await addDependent({ name, relation });
    setName('');
    setRelation('');
    loadDependents();
  }

  useEffect(() => {
    loadDependents();
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 26, fontWeight: '700' }}>
        Family Members
      </Text>

      {/* Add Dependent */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Add Family Member
        </Text>

        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
          }}
        />

        <TextInput
          placeholder="Relation (son, daughter, father)"
          value={relation}
          onChangeText={setRelation}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
          }}
        />

        <TouchableOpacity
          onPress={handleAdd}
          style={{
            marginTop: 12,
            backgroundColor: '#000',
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Your Family
        </Text>

        {loading && <Text>Loading...</Text>}

        {!loading && dependents.length === 0 && (
          <Text style={{ color: '#666', marginTop: 10 }}>
            No family members added yet.
          </Text>
        )}

        {dependents.map((d) => (
          <View
            key={d.id}
            style={{
              marginTop: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {d.name}
            </Text>
            <Text style={{ color: '#666' }}>
              {d.relation}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
