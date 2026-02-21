import { useState, useEffect } from 'react';
import { useGetCallerLaborer, useSaveCallerLaborer } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Loader2, IdCard } from 'lucide-react';
import type { LaborerInput, Service, Availability } from '../backend';
import { useNavigate } from '@tanstack/react-router';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: laborer, isLoading } = useGetCallerLaborer();
  const { mutate: saveLaborer, isPending } = useSaveCallerLaborer();

  const [formData, setFormData] = useState<LaborerInput>({
    name: '',
    skills: [],
    services: [],
    location: '',
    contact: '',
    mobileNumber: '',
    availability: {
      status: { __kind__: 'available', available: null },
      lastUpdated: BigInt(Date.now() * 1000000),
    },
  });

  const [skillInput, setSkillInput] = useState('');
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '' });

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (laborer) {
      setFormData({
        name: laborer.name,
        skills: laborer.skills,
        services: laborer.services,
        location: laborer.location,
        contact: laborer.contact,
        mobileNumber: laborer.mobileNumber,
        availability: laborer.availability,
      });
    }
  }, [laborer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mobile number
    if (!formData.mobileNumber || formData.mobileNumber.trim().length === 0) {
      alert('Mobile number is required');
      return;
    }
    
    if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      alert('Mobile number must be exactly 10 digits');
      return;
    }
    
    saveLaborer(formData);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const addService = () => {
    if (serviceForm.name.trim() && serviceForm.price) {
      const newService: Service = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        price: BigInt(serviceForm.price),
      };
      setFormData({ ...formData, services: [...formData.services, newService] });
      setServiceForm({ name: '', description: '', price: '' });
    }
  };

  const removeService = (index: number) => {
    setFormData({ ...formData, services: formData.services.filter((_, i) => i !== index) });
  };

  const handleAvailabilityChange = (value: string) => {
    let newStatus: Availability['status'];
    
    switch (value) {
      case 'available':
        newStatus = { __kind__: 'available', available: null };
        break;
      case 'unavailable':
        newStatus = { __kind__: 'unavailable', unavailable: null };
        break;
      case 'onJob':
        newStatus = { __kind__: 'onJob', onJob: null };
        break;
      case 'pending':
        newStatus = { __kind__: 'pending', pending: null };
        break;
      default:
        newStatus = { __kind__: 'available', available: null };
    }

    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        status: newStatus,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your laborer profile and services</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {laborer && laborer.laborId && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <IdCard className="w-5 h-5" />
                Labour ID
              </CardTitle>
              <CardDescription>Your unique identification number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  value={laborer.laborId}
                  disabled
                  className="font-mono text-lg font-semibold bg-white dark:bg-gray-950 border-amber-300 dark:border-amber-700"
                />
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  Read-only
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="10-digit mobile number"
                pattern="\d{10}"
                maxLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter a 10-digit mobile number for booking communications
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact (Phone/Email)</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location/Neighborhood</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Downtown, Westside"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Add your professional skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g., Plumbing, Carpentry"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
            <CardDescription>List the services you provide with pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Service name"
                />
                <Input
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    placeholder="Price"
                  />
                  <Button type="button" onClick={addService} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {formData.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">{service.description}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-amber-600">${service.price.toString()}</span>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability Status</CardTitle>
            <CardDescription>Let others know your current availability</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.availability.status.__kind__}
              onValueChange={handleAvailabilityChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="onJob">On Job</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Profile'
          )}
        </Button>
      </form>
    </div>
  );
}
